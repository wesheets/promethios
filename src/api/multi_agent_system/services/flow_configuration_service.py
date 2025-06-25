"""
Flow Type Configuration & Validation Service

Handles workflow configuration, execution flow validation, and sequencing
of agent interactions for multi-agent systems. Ensures proper flow design
based on collaboration models and system requirements.
"""

from typing import Dict, List, Any, Optional, Tuple, Union, Set
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import json
import uuid
from collections import defaultdict, deque

class FlowType(str, Enum):
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    PIPELINE = "pipeline"
    SCATTER_GATHER = "scatter_gather"
    ROUND_ROBIN = "round_robin"
    PRIORITY_QUEUE = "priority_queue"
    EVENT_DRIVEN = "event_driven"
    HYBRID = "hybrid"

class FlowStatus(str, Enum):
    DRAFT = "draft"
    VALIDATED = "validated"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ExecutionMode(str, Enum):
    SYNCHRONOUS = "synchronous"
    ASYNCHRONOUS = "asynchronous"
    MIXED = "mixed"

class FlowValidationLevel(str, Enum):
    BASIC = "basic"
    COMPREHENSIVE = "comprehensive"
    STRICT = "strict"

class ConditionType(str, Enum):
    AGENT_OUTPUT = "agent_output"
    PERFORMANCE_METRIC = "performance_metric"
    TIME_BASED = "time_based"
    RESOURCE_AVAILABILITY = "resource_availability"
    EXTERNAL_EVENT = "external_event"
    USER_INPUT = "user_input"

class FlowNode(BaseModel):
    node_id: str = Field(..., description="Unique node identifier")
    node_type: str = Field(..., description="Type of node (agent, condition, merge, split)")
    agent_id: Optional[str] = Field(None, description="Agent ID if this is an agent node")
    position: Dict[str, float] = Field(default_factory=dict, description="Node position in flow diagram")
    configuration: Dict[str, Any] = Field(default_factory=dict, description="Node-specific configuration")
    timeout_seconds: int = Field(300, description="Node execution timeout")
    retry_count: int = Field(0, description="Number of retries on failure")
    dependencies: List[str] = Field(default_factory=list, description="Required predecessor nodes")
    conditions: List[Dict[str, Any]] = Field(default_factory=list, description="Execution conditions")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional node metadata")

class FlowEdge(BaseModel):
    edge_id: str = Field(..., description="Unique edge identifier")
    from_node: str = Field(..., description="Source node ID")
    to_node: str = Field(..., description="Target node ID")
    condition: Optional[Dict[str, Any]] = Field(None, description="Edge traversal condition")
    weight: float = Field(1.0, description="Edge weight for routing decisions")
    data_mapping: Dict[str, str] = Field(default_factory=dict, description="Data transformation mapping")
    is_default: bool = Field(False, description="Default edge if conditions fail")

class FlowConfiguration(BaseModel):
    flow_id: str = Field(..., description="Unique flow identifier")
    name: str = Field(..., description="Human-readable flow name")
    description: str = Field(..., description="Flow description and purpose")
    flow_type: FlowType = Field(..., description="Type of flow")
    execution_mode: ExecutionMode = Field(ExecutionMode.ASYNCHRONOUS, description="Execution mode")
    context_id: str = Field(..., description="Associated multi-agent context")
    nodes: List[FlowNode] = Field(default_factory=list, description="Flow nodes")
    edges: List[FlowEdge] = Field(default_factory=list, description="Flow edges")
    global_timeout_seconds: int = Field(3600, description="Global flow timeout")
    max_concurrent_nodes: int = Field(10, description="Maximum concurrent node executions")
    error_handling_strategy: str = Field("continue", description="Error handling strategy")
    data_persistence: bool = Field(True, description="Persist intermediate data")
    monitoring_enabled: bool = Field(True, description="Enable flow monitoring")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class FlowValidationResult(BaseModel):
    flow_id: str
    is_valid: bool
    validation_level: FlowValidationLevel
    validation_timestamp: datetime = Field(default_factory=datetime.utcnow)
    issues: List[str] = Field(default_factory=list, description="Validation issues found")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    suggestions: List[str] = Field(default_factory=list, description="Optimization suggestions")
    performance_estimate: Dict[str, float] = Field(default_factory=dict, description="Performance estimates")
    resource_requirements: Dict[str, Any] = Field(default_factory=dict, description="Resource requirements")
    complexity_score: float = Field(0.0, description="Flow complexity score (0-100)")

class FlowExecution(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    flow_id: str
    context_id: str
    status: FlowStatus = Field(FlowStatus.DRAFT)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    current_nodes: List[str] = Field(default_factory=list, description="Currently executing nodes")
    completed_nodes: List[str] = Field(default_factory=list, description="Completed nodes")
    failed_nodes: List[str] = Field(default_factory=list, description="Failed nodes")
    node_results: Dict[str, Any] = Field(default_factory=dict, description="Node execution results")
    flow_data: Dict[str, Any] = Field(default_factory=dict, description="Flow-wide data context")
    performance_metrics: Dict[str, float] = Field(default_factory=dict, description="Execution metrics")
    error_log: List[str] = Field(default_factory=list, description="Error messages")

class FlowTemplate(BaseModel):
    template_id: str = Field(..., description="Template identifier")
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    flow_type: FlowType = Field(..., description="Flow type")
    collaboration_model: str = Field(..., description="Compatible collaboration model")
    agent_count_range: Tuple[int, int] = Field(..., description="Supported agent count range")
    template_nodes: List[Dict[str, Any]] = Field(default_factory=list, description="Template node definitions")
    template_edges: List[Dict[str, Any]] = Field(default_factory=list, description="Template edge definitions")
    configuration_parameters: Dict[str, Any] = Field(default_factory=dict, description="Configurable parameters")
    use_cases: List[str] = Field(default_factory=list, description="Recommended use cases")
    complexity_level: str = Field("medium", description="Template complexity level")

class FlowOptimizationSuggestion(BaseModel):
    suggestion_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    flow_id: str
    suggestion_type: str = Field(..., description="Type of optimization")
    priority: str = Field("medium", description="Suggestion priority")
    description: str = Field(..., description="Optimization description")
    expected_improvement: Dict[str, float] = Field(default_factory=dict, description="Expected improvements")
    implementation_effort: str = Field("medium", description="Implementation effort level")
    auto_applicable: bool = Field(False, description="Can be applied automatically")

class FlowConfigurationService:
    """Service for flow type configuration and validation."""
    
    def __init__(self):
        self.flow_configurations: Dict[str, FlowConfiguration] = {}
        self.flow_executions: Dict[str, FlowExecution] = {}
        self.flow_templates = self._initialize_flow_templates()
        self.validation_cache: Dict[str, FlowValidationResult] = {}
        
    def _initialize_flow_templates(self) -> List[FlowTemplate]:
        """Initialize predefined flow templates."""
        
        return [
            # Sequential Flow Template
            FlowTemplate(
                template_id="sequential_basic",
                name="Basic Sequential Flow",
                description="Simple sequential execution of agents in order",
                flow_type=FlowType.SEQUENTIAL,
                collaboration_model="sequential_handoffs",
                agent_count_range=(2, 10),
                template_nodes=[
                    {"type": "start", "position": {"x": 100, "y": 100}},
                    {"type": "agent", "position": {"x": 200, "y": 100}, "role": "processor"},
                    {"type": "agent", "position": {"x": 300, "y": 100}, "role": "validator"},
                    {"type": "end", "position": {"x": 400, "y": 100}}
                ],
                template_edges=[
                    {"from": "start", "to": "agent_1"},
                    {"from": "agent_1", "to": "agent_2"},
                    {"from": "agent_2", "to": "end"}
                ],
                use_cases=["Document processing", "Data transformation", "Quality assurance workflows"],
                complexity_level="low"
            ),
            
            # Parallel Flow Template
            FlowTemplate(
                template_id="parallel_basic",
                name="Basic Parallel Flow",
                description="Parallel execution with result aggregation",
                flow_type=FlowType.PARALLEL,
                collaboration_model="parallel_processing",
                agent_count_range=(2, 20),
                template_nodes=[
                    {"type": "start", "position": {"x": 100, "y": 200}},
                    {"type": "split", "position": {"x": 200, "y": 200}},
                    {"type": "agent", "position": {"x": 300, "y": 100}, "role": "processor"},
                    {"type": "agent", "position": {"x": 300, "y": 200}, "role": "processor"},
                    {"type": "agent", "position": {"x": 300, "y": 300}, "role": "processor"},
                    {"type": "merge", "position": {"x": 400, "y": 200}},
                    {"type": "agent", "position": {"x": 500, "y": 200}, "role": "aggregator"},
                    {"type": "end", "position": {"x": 600, "y": 200}}
                ],
                use_cases=["Data analysis", "Content generation", "Parallel research tasks"],
                complexity_level="medium"
            ),
            
            # Conditional Flow Template
            FlowTemplate(
                template_id="conditional_decision",
                name="Conditional Decision Flow",
                description="Flow with conditional branching based on agent outputs",
                flow_type=FlowType.CONDITIONAL,
                collaboration_model="consensus_decision",
                agent_count_range=(3, 8),
                template_nodes=[
                    {"type": "start", "position": {"x": 100, "y": 200}},
                    {"type": "agent", "position": {"x": 200, "y": 200}, "role": "analyzer"},
                    {"type": "condition", "position": {"x": 300, "y": 200}},
                    {"type": "agent", "position": {"x": 400, "y": 100}, "role": "specialist_a"},
                    {"type": "agent", "position": {"x": 400, "y": 300}, "role": "specialist_b"},
                    {"type": "merge", "position": {"x": 500, "y": 200}},
                    {"type": "end", "position": {"x": 600, "y": 200}}
                ],
                use_cases=["Decision support", "Adaptive workflows", "Expert system routing"],
                complexity_level="high"
            ),
            
            # Pipeline Flow Template
            FlowTemplate(
                template_id="pipeline_processing",
                name="Processing Pipeline",
                description="Multi-stage processing pipeline with feedback loops",
                flow_type=FlowType.PIPELINE,
                collaboration_model="sequential_handoffs",
                agent_count_range=(3, 15),
                template_nodes=[
                    {"type": "start", "position": {"x": 100, "y": 200}},
                    {"type": "agent", "position": {"x": 200, "y": 200}, "role": "preprocessor"},
                    {"type": "agent", "position": {"x": 300, "y": 200}, "role": "processor"},
                    {"type": "agent", "position": {"x": 400, "y": 200}, "role": "postprocessor"},
                    {"type": "condition", "position": {"x": 500, "y": 200}},
                    {"type": "agent", "position": {"x": 600, "y": 200}, "role": "validator"},
                    {"type": "end", "position": {"x": 700, "y": 200}}
                ],
                use_cases=["Data processing pipelines", "Content creation workflows", "Quality control processes"],
                complexity_level="medium"
            ),
            
            # Scatter-Gather Template
            FlowTemplate(
                template_id="scatter_gather",
                name="Scatter-Gather Pattern",
                description="Distribute work to multiple agents and gather results",
                flow_type=FlowType.SCATTER_GATHER,
                collaboration_model="parallel_processing",
                agent_count_range=(4, 25),
                template_nodes=[
                    {"type": "start", "position": {"x": 100, "y": 300}},
                    {"type": "agent", "position": {"x": 200, "y": 300}, "role": "coordinator"},
                    {"type": "scatter", "position": {"x": 300, "y": 300}},
                    {"type": "agent", "position": {"x": 400, "y": 150}, "role": "worker"},
                    {"type": "agent", "position": {"x": 400, "y": 250}, "role": "worker"},
                    {"type": "agent", "position": {"x": 400, "y": 350}, "role": "worker"},
                    {"type": "agent", "position": {"x": 400, "y": 450}, "role": "worker"},
                    {"type": "gather", "position": {"x": 500, "y": 300}},
                    {"type": "agent", "position": {"x": 600, "y": 300}, "role": "aggregator"},
                    {"type": "end", "position": {"x": 700, "y": 300}}
                ],
                use_cases=["Distributed computing", "Research aggregation", "Multi-source analysis"],
                complexity_level="high"
            ),
            
            # Event-Driven Template
            FlowTemplate(
                template_id="event_driven",
                name="Event-Driven Flow",
                description="Reactive flow based on events and triggers",
                flow_type=FlowType.EVENT_DRIVEN,
                collaboration_model="shared_context",
                agent_count_range=(2, 12),
                template_nodes=[
                    {"type": "event_listener", "position": {"x": 100, "y": 200}},
                    {"type": "condition", "position": {"x": 200, "y": 200}},
                    {"type": "agent", "position": {"x": 300, "y": 100}, "role": "responder_a"},
                    {"type": "agent", "position": {"x": 300, "y": 200}, "role": "responder_b"},
                    {"type": "agent", "position": {"x": 300, "y": 300}, "role": "responder_c"},
                    {"type": "event_publisher", "position": {"x": 400, "y": 200}}
                ],
                use_cases=["Real-time monitoring", "Alert systems", "Reactive automation"],
                complexity_level="high"
            )
        ]
    
    async def create_flow_configuration(self, config: FlowConfiguration) -> Dict[str, Any]:
        """Create a new flow configuration."""
        
        # Validate basic configuration
        validation_issues = await self._validate_basic_configuration(config)
        
        # Store configuration
        config.updated_at = datetime.utcnow()
        self.flow_configurations[config.flow_id] = config
        
        # Clear validation cache for this flow
        if config.flow_id in self.validation_cache:
            del self.validation_cache[config.flow_id]
        
        return {
            "success": True,
            "flow_id": config.flow_id,
            "validation_issues": validation_issues,
            "node_count": len(config.nodes),
            "edge_count": len(config.edges),
            "estimated_complexity": self._calculate_complexity_score(config)
        }
    
    async def validate_flow_configuration(
        self, 
        flow_id: str, 
        validation_level: FlowValidationLevel = FlowValidationLevel.COMPREHENSIVE
    ) -> FlowValidationResult:
        """Validate a flow configuration."""
        
        # Check cache first
        cache_key = f"{flow_id}_{validation_level.value}"
        if cache_key in self.validation_cache:
            cached_result = self.validation_cache[cache_key]
            # Return cached result if less than 5 minutes old
            if (datetime.utcnow() - cached_result.validation_timestamp).total_seconds() < 300:
                return cached_result
        
        if flow_id not in self.flow_configurations:
            raise ValueError(f"Flow configuration {flow_id} not found")
        
        config = self.flow_configurations[flow_id]
        
        result = FlowValidationResult(
            flow_id=flow_id,
            is_valid=True,
            validation_level=validation_level
        )
        
        # Perform validation based on level
        if validation_level == FlowValidationLevel.BASIC:
            await self._validate_basic_structure(config, result)
        elif validation_level == FlowValidationLevel.COMPREHENSIVE:
            await self._validate_basic_structure(config, result)
            await self._validate_flow_logic(config, result)
            await self._validate_performance_characteristics(config, result)
        elif validation_level == FlowValidationLevel.STRICT:
            await self._validate_basic_structure(config, result)
            await self._validate_flow_logic(config, result)
            await self._validate_performance_characteristics(config, result)
            await self._validate_security_compliance(config, result)
            await self._validate_resource_requirements(config, result)
        
        # Calculate complexity score
        result.complexity_score = self._calculate_complexity_score(config)
        
        # Generate performance estimates
        result.performance_estimate = await self._estimate_performance(config)
        
        # Generate optimization suggestions
        suggestions = await self._generate_optimization_suggestions(config)
        result.suggestions = [s.description for s in suggestions]
        
        # Determine overall validity
        result.is_valid = len(result.issues) == 0
        
        # Cache result
        self.validation_cache[cache_key] = result
        
        return result
    
    async def _validate_basic_structure(self, config: FlowConfiguration, result: FlowValidationResult):
        """Validate basic flow structure."""
        
        # Check for nodes
        if not config.nodes:
            result.issues.append("Flow has no nodes defined")
            return
        
        # Check for edges
        if len(config.nodes) > 1 and not config.edges:
            result.issues.append("Flow has multiple nodes but no edges defined")
        
        # Validate node IDs are unique
        node_ids = [node.node_id for node in config.nodes]
        if len(node_ids) != len(set(node_ids)):
            result.issues.append("Duplicate node IDs found in flow")
        
        # Validate edge references
        for edge in config.edges:
            if edge.from_node not in node_ids:
                result.issues.append(f"Edge references non-existent source node: {edge.from_node}")
            if edge.to_node not in node_ids:
                result.issues.append(f"Edge references non-existent target node: {edge.to_node}")
        
        # Check for start and end nodes
        node_types = [node.configuration.get("type", "agent") for node in config.nodes]
        if "start" not in node_types:
            result.warnings.append("Flow has no explicit start node")
        if "end" not in node_types:
            result.warnings.append("Flow has no explicit end node")
    
    async def _validate_flow_logic(self, config: FlowConfiguration, result: FlowValidationResult):
        """Validate flow logic and connectivity."""
        
        # Build adjacency graph
        graph = defaultdict(list)
        for edge in config.edges:
            graph[edge.from_node].append(edge.to_node)
        
        # Check for unreachable nodes
        node_ids = {node.node_id for node in config.nodes}
        start_nodes = [node.node_id for node in config.nodes 
                      if node.configuration.get("type") == "start"]
        
        if start_nodes:
            reachable = set()
            queue = deque(start_nodes)
            while queue:
                current = queue.popleft()
                if current not in reachable:
                    reachable.add(current)
                    queue.extend(graph[current])
            
            unreachable = node_ids - reachable
            if unreachable:
                result.issues.append(f"Unreachable nodes found: {', '.join(unreachable)}")
        
        # Check for cycles (if not allowed by flow type)
        if config.flow_type in [FlowType.SEQUENTIAL, FlowType.PIPELINE]:
            if self._has_cycles(graph, node_ids):
                result.issues.append(f"Cycles detected in {config.flow_type.value} flow")
        
        # Validate dependencies
        for node in config.nodes:
            for dep in node.dependencies:
                if dep not in node_ids:
                    result.issues.append(f"Node {node.node_id} has invalid dependency: {dep}")
        
        # Check for isolated nodes
        connected_nodes = set()
        for edge in config.edges:
            connected_nodes.add(edge.from_node)
            connected_nodes.add(edge.to_node)
        
        isolated = node_ids - connected_nodes
        if len(isolated) > 1:  # Allow one isolated node (could be start/end)
            result.warnings.append(f"Isolated nodes found: {', '.join(isolated)}")
    
    async def _validate_performance_characteristics(self, config: FlowConfiguration, result: FlowValidationResult):
        """Validate performance characteristics."""
        
        # Check timeout configurations
        total_sequential_timeout = 0
        for node in config.nodes:
            if node.timeout_seconds > config.global_timeout_seconds:
                result.warnings.append(f"Node {node.node_id} timeout exceeds global timeout")
            total_sequential_timeout += node.timeout_seconds
        
        if total_sequential_timeout > config.global_timeout_seconds * 2:
            result.warnings.append("Sum of node timeouts significantly exceeds global timeout")
        
        # Check concurrency limits
        if config.max_concurrent_nodes < 1:
            result.issues.append("Maximum concurrent nodes must be at least 1")
        elif config.max_concurrent_nodes > 50:
            result.warnings.append("High concurrency limit may impact performance")
        
        # Validate flow type compatibility
        if config.flow_type == FlowType.PARALLEL and config.max_concurrent_nodes == 1:
            result.warnings.append("Parallel flow with concurrency limit of 1 may not be optimal")
    
    async def _validate_security_compliance(self, config: FlowConfiguration, result: FlowValidationResult):
        """Validate security and compliance aspects."""
        
        # Check for sensitive data handling
        for node in config.nodes:
            if node.agent_id and not node.configuration.get("security_validated", False):
                result.warnings.append(f"Node {node.node_id} agent security not validated")
        
        # Check data persistence settings
        if config.data_persistence and not config.configuration.get("encryption_enabled", False):
            result.warnings.append("Data persistence enabled without encryption")
        
        # Validate monitoring requirements
        if not config.monitoring_enabled:
            result.warnings.append("Flow monitoring is disabled - may impact compliance")
    
    async def _validate_resource_requirements(self, config: FlowConfiguration, result: FlowValidationResult):
        """Validate resource requirements."""
        
        # Estimate resource usage
        estimated_memory = len(config.nodes) * 100  # MB per node
        estimated_cpu = config.max_concurrent_nodes * 0.5  # CPU cores
        
        result.resource_requirements = {
            "estimated_memory_mb": estimated_memory,
            "estimated_cpu_cores": estimated_cpu,
            "estimated_storage_mb": 50 if config.data_persistence else 10,
            "network_bandwidth_mbps": config.max_concurrent_nodes * 10
        }
        
        # Check for resource constraints
        if estimated_memory > 1000:
            result.warnings.append("High memory usage estimated - consider optimization")
        
        if estimated_cpu > 4:
            result.warnings.append("High CPU usage estimated - consider reducing concurrency")
    
    def _has_cycles(self, graph: Dict[str, List[str]], nodes: Set[str]) -> bool:
        """Check if graph has cycles using DFS."""
        
        WHITE, GRAY, BLACK = 0, 1, 2
        colors = {node: WHITE for node in nodes}
        
        def dfs(node):
            if colors[node] == GRAY:
                return True  # Back edge found, cycle detected
            if colors[node] == BLACK:
                return False
            
            colors[node] = GRAY
            for neighbor in graph[node]:
                if dfs(neighbor):
                    return True
            colors[node] = BLACK
            return False
        
        for node in nodes:
            if colors[node] == WHITE:
                if dfs(node):
                    return True
        return False
    
    def _calculate_complexity_score(self, config: FlowConfiguration) -> float:
        """Calculate flow complexity score (0-100)."""
        
        base_score = 0.0
        
        # Node count factor
        node_factor = min(len(config.nodes) * 5, 30)
        base_score += node_factor
        
        # Edge count factor
        edge_factor = min(len(config.edges) * 3, 20)
        base_score += edge_factor
        
        # Flow type complexity
        type_complexity = {
            FlowType.SEQUENTIAL: 5,
            FlowType.PARALLEL: 15,
            FlowType.CONDITIONAL: 25,
            FlowType.PIPELINE: 20,
            FlowType.SCATTER_GATHER: 30,
            FlowType.ROUND_ROBIN: 20,
            FlowType.PRIORITY_QUEUE: 25,
            FlowType.EVENT_DRIVEN: 35,
            FlowType.HYBRID: 40
        }
        base_score += type_complexity.get(config.flow_type, 15)
        
        # Dependency complexity
        total_deps = sum(len(node.dependencies) for node in config.nodes)
        dep_factor = min(total_deps * 2, 15)
        base_score += dep_factor
        
        # Condition complexity
        total_conditions = sum(len(node.conditions) for node in config.nodes)
        condition_factor = min(total_conditions * 3, 10)
        base_score += condition_factor
        
        return min(base_score, 100.0)
    
    async def _estimate_performance(self, config: FlowConfiguration) -> Dict[str, float]:
        """Estimate flow performance characteristics."""
        
        # Base estimates
        avg_node_time = 2.0  # seconds
        network_overhead = 0.1  # seconds per edge
        
        # Calculate estimates based on flow type
        if config.flow_type == FlowType.SEQUENTIAL:
            estimated_duration = len(config.nodes) * avg_node_time
            estimated_throughput = 1.0 / estimated_duration
        elif config.flow_type == FlowType.PARALLEL:
            estimated_duration = avg_node_time + (len(config.edges) * network_overhead)
            estimated_throughput = config.max_concurrent_nodes / estimated_duration
        else:
            # Complex flow types
            estimated_duration = (len(config.nodes) * avg_node_time * 0.7) + (len(config.edges) * network_overhead)
            estimated_throughput = (config.max_concurrent_nodes * 0.8) / estimated_duration
        
        return {
            "estimated_duration_seconds": estimated_duration,
            "estimated_throughput_per_minute": estimated_throughput * 60,
            "estimated_resource_efficiency": min(90.0, 100.0 - config.complexity_score * 0.3),
            "estimated_scalability_factor": min(5.0, config.max_concurrent_nodes / 2.0)
        }
    
    async def _generate_optimization_suggestions(self, config: FlowConfiguration) -> List[FlowOptimizationSuggestion]:
        """Generate optimization suggestions for the flow."""
        
        suggestions = []
        
        # Concurrency optimization
        if config.flow_type == FlowType.PARALLEL and config.max_concurrent_nodes < len(config.nodes) / 2:
            suggestions.append(FlowOptimizationSuggestion(
                flow_id=config.flow_id,
                suggestion_type="concurrency",
                priority="medium",
                description="Consider increasing max_concurrent_nodes for better parallel performance",
                expected_improvement={"throughput": 25.0, "duration": -15.0},
                implementation_effort="low",
                auto_applicable=True
            ))
        
        # Timeout optimization
        long_timeout_nodes = [n for n in config.nodes if n.timeout_seconds > 600]
        if long_timeout_nodes:
            suggestions.append(FlowOptimizationSuggestion(
                flow_id=config.flow_id,
                suggestion_type="timeout",
                priority="low",
                description=f"Consider reducing timeout for {len(long_timeout_nodes)} nodes with long timeouts",
                expected_improvement={"resource_usage": -10.0},
                implementation_effort="low"
            ))
        
        # Flow type optimization
        if config.flow_type == FlowType.SEQUENTIAL and len(config.nodes) > 5:
            # Check if some nodes can be parallelized
            independent_nodes = [n for n in config.nodes if not n.dependencies]
            if len(independent_nodes) > 2:
                suggestions.append(FlowOptimizationSuggestion(
                    flow_id=config.flow_id,
                    suggestion_type="flow_type",
                    priority="high",
                    description="Consider converting to hybrid flow with parallel sections",
                    expected_improvement={"duration": -30.0, "throughput": 40.0},
                    implementation_effort="medium"
                ))
        
        # Monitoring optimization
        if not config.monitoring_enabled:
            suggestions.append(FlowOptimizationSuggestion(
                flow_id=config.flow_id,
                suggestion_type="monitoring",
                priority="medium",
                description="Enable monitoring for better observability and debugging",
                expected_improvement={"reliability": 15.0},
                implementation_effort="low",
                auto_applicable=True
            ))
        
        return suggestions
    
    async def create_flow_from_template(
        self, 
        template_id: str, 
        context_id: str, 
        agent_ids: List[str],
        customization: Optional[Dict[str, Any]] = None
    ) -> FlowConfiguration:
        """Create a flow configuration from a template."""
        
        # Find template
        template = next((t for t in self.flow_templates if t.template_id == template_id), None)
        if not template:
            raise ValueError(f"Template {template_id} not found")
        
        # Validate agent count
        min_agents, max_agents = template.agent_count_range
        if not (min_agents <= len(agent_ids) <= max_agents):
            raise ValueError(f"Template requires {min_agents}-{max_agents} agents, got {len(agent_ids)}")
        
        # Create flow configuration
        flow_id = f"{template_id}_{context_id}_{int(datetime.utcnow().timestamp())}"
        
        config = FlowConfiguration(
            flow_id=flow_id,
            name=f"{template.name} - {context_id}",
            description=f"Generated from template: {template.description}",
            flow_type=template.flow_type,
            context_id=context_id
        )
        
        # Generate nodes from template
        agent_index = 0
        for i, template_node in enumerate(template.template_nodes):
            node_id = f"node_{i}"
            
            node = FlowNode(
                node_id=node_id,
                node_type=template_node.get("type", "agent"),
                position=template_node.get("position", {"x": i * 100, "y": 100}),
                configuration=template_node.copy()
            )
            
            # Assign agent if this is an agent node
            if node.node_type == "agent" and agent_index < len(agent_ids):
                node.agent_id = agent_ids[agent_index]
                agent_index += 1
            
            config.nodes.append(node)
        
        # Generate edges from template
        node_id_mapping = {f"node_{i}": config.nodes[i].node_id for i in range(len(config.nodes))}
        
        for i, template_edge in enumerate(template.template_edges):
            from_node = template_edge.get("from")
            to_node = template_edge.get("to")
            
            # Map template node references to actual node IDs
            if from_node in node_id_mapping:
                from_node = node_id_mapping[from_node]
            if to_node in node_id_mapping:
                to_node = node_id_mapping[to_node]
            
            edge = FlowEdge(
                edge_id=f"edge_{i}",
                from_node=from_node,
                to_node=to_node,
                condition=template_edge.get("condition"),
                weight=template_edge.get("weight", 1.0)
            )
            
            config.edges.append(edge)
        
        # Apply customizations
        if customization:
            if "execution_mode" in customization:
                config.execution_mode = ExecutionMode(customization["execution_mode"])
            if "max_concurrent_nodes" in customization:
                config.max_concurrent_nodes = customization["max_concurrent_nodes"]
            if "global_timeout_seconds" in customization:
                config.global_timeout_seconds = customization["global_timeout_seconds"]
        
        return config
    
    async def execute_flow(self, flow_id: str, input_data: Dict[str, Any] = None) -> FlowExecution:
        """Execute a flow configuration."""
        
        if flow_id not in self.flow_configurations:
            raise ValueError(f"Flow configuration {flow_id} not found")
        
        config = self.flow_configurations[flow_id]
        
        # Create execution instance
        execution = FlowExecution(
            flow_id=flow_id,
            context_id=config.context_id,
            status=FlowStatus.ACTIVE,
            start_time=datetime.utcnow(),
            flow_data=input_data or {}
        )
        
        self.flow_executions[execution.execution_id] = execution
        
        try:
            # Execute flow based on type
            if config.flow_type == FlowType.SEQUENTIAL:
                await self._execute_sequential_flow(config, execution)
            elif config.flow_type == FlowType.PARALLEL:
                await self._execute_parallel_flow(config, execution)
            elif config.flow_type == FlowType.CONDITIONAL:
                await self._execute_conditional_flow(config, execution)
            else:
                await self._execute_generic_flow(config, execution)
            
            execution.status = FlowStatus.COMPLETED
            execution.end_time = datetime.utcnow()
            
        except Exception as e:
            execution.status = FlowStatus.FAILED
            execution.end_time = datetime.utcnow()
            execution.error_log.append(f"Flow execution failed: {str(e)}")
        
        return execution
    
    async def _execute_sequential_flow(self, config: FlowConfiguration, execution: FlowExecution):
        """Execute sequential flow."""
        
        # Find start node
        start_nodes = [n for n in config.nodes if n.configuration.get("type") == "start"]
        if not start_nodes:
            start_nodes = [config.nodes[0]]  # Use first node as start
        
        current_node = start_nodes[0]
        
        while current_node:
            # Execute current node
            await self._execute_node(current_node, config, execution)
            
            # Find next node
            next_edges = [e for e in config.edges if e.from_node == current_node.node_id]
            if next_edges:
                next_node_id = next_edges[0].to_node
                current_node = next((n for n in config.nodes if n.node_id == next_node_id), None)
            else:
                current_node = None
    
    async def _execute_parallel_flow(self, config: FlowConfiguration, execution: FlowExecution):
        """Execute parallel flow."""
        
        # Find all nodes that can execute in parallel (no dependencies)
        parallel_nodes = [n for n in config.nodes if not n.dependencies and n.configuration.get("type") != "start"]
        
        # Execute nodes in parallel
        tasks = []
        for node in parallel_nodes[:config.max_concurrent_nodes]:
            task = self._execute_node(node, config, execution)
            tasks.append(task)
        
        await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _execute_conditional_flow(self, config: FlowConfiguration, execution: FlowExecution):
        """Execute conditional flow."""
        
        # Simplified conditional execution
        for node in config.nodes:
            if node.conditions:
                # Evaluate conditions (simplified)
                should_execute = True  # Would implement actual condition evaluation
                if should_execute:
                    await self._execute_node(node, config, execution)
            else:
                await self._execute_node(node, config, execution)
    
    async def _execute_generic_flow(self, config: FlowConfiguration, execution: FlowExecution):
        """Execute generic flow type."""
        
        # Default to sequential execution for unknown types
        await self._execute_sequential_flow(config, execution)
    
    async def _execute_node(self, node: FlowNode, config: FlowConfiguration, execution: FlowExecution):
        """Execute a single node."""
        
        execution.current_nodes.append(node.node_id)
        
        try:
            # Simulate node execution
            await asyncio.sleep(0.1)  # Simulate processing time
            
            # Mock node result
            result = {
                "node_id": node.node_id,
                "status": "completed",
                "output": f"Result from {node.node_id}",
                "execution_time": 0.1,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            execution.node_results[node.node_id] = result
            execution.completed_nodes.append(node.node_id)
            
        except Exception as e:
            execution.failed_nodes.append(node.node_id)
            execution.error_log.append(f"Node {node.node_id} failed: {str(e)}")
        finally:
            if node.node_id in execution.current_nodes:
                execution.current_nodes.remove(node.node_id)
    
    async def get_dashboard_data(self, context_id: Optional[str] = None) -> Dict[str, Any]:
        """Get flow configuration data for the governance dashboard."""
        
        # Filter by context if specified
        configs = list(self.flow_configurations.values())
        executions = list(self.flow_executions.values())
        
        if context_id:
            configs = [c for c in configs if c.context_id == context_id]
            executions = [e for e in executions if e.context_id == context_id]
        
        # Calculate summary statistics
        total_flows = len(configs)
        active_executions = len([e for e in executions if e.status == FlowStatus.ACTIVE])
        completed_executions = len([e for e in executions if e.status == FlowStatus.COMPLETED])
        
        # Calculate average complexity
        avg_complexity = sum(self._calculate_complexity_score(c) for c in configs) / total_flows if total_flows > 0 else 0
        
        # Flow type distribution
        flow_type_dist = defaultdict(int)
        for config in configs:
            flow_type_dist[config.flow_type.value] += 1
        
        return {
            "overview": {
                "total_flow_configurations": total_flows,
                "active_executions": active_executions,
                "completed_executions": completed_executions,
                "average_complexity_score": avg_complexity,
                "available_templates": len(self.flow_templates)
            },
            "flow_type_distribution": dict(flow_type_dist),
            "recent_executions": [
                {
                    "execution_id": e.execution_id,
                    "flow_id": e.flow_id,
                    "context_id": e.context_id,
                    "status": e.status.value,
                    "start_time": e.start_time.isoformat() if e.start_time else None,
                    "duration_seconds": ((e.end_time or datetime.utcnow()) - e.start_time).total_seconds() if e.start_time else 0,
                    "completed_nodes": len(e.completed_nodes),
                    "failed_nodes": len(e.failed_nodes)
                }
                for e in executions[-10:]  # Last 10 executions
            ],
            "flow_configurations": [
                {
                    "flow_id": c.flow_id,
                    "name": c.name,
                    "flow_type": c.flow_type.value,
                    "context_id": c.context_id,
                    "node_count": len(c.nodes),
                    "edge_count": len(c.edges),
                    "complexity_score": self._calculate_complexity_score(c),
                    "created_at": c.created_at.isoformat()
                }
                for c in configs
            ],
            "templates": [
                {
                    "template_id": t.template_id,
                    "name": t.name,
                    "flow_type": t.flow_type.value,
                    "complexity_level": t.complexity_level,
                    "agent_count_range": t.agent_count_range,
                    "use_cases": t.use_cases
                }
                for t in self.flow_templates
            ]
        }

# Global service instance
flow_configuration_service = FlowConfigurationService()

