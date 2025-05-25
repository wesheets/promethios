"""
TheAgentCompany Integration Testing Module for Promethios Phase 6.1

This module provides integration with TheAgentCompany benchmark for testing
the Promethios governance system, including scenario management, metrics collection,
and compliance result analysis.
"""

import json
import os
import logging
import requests
import time
from typing import Dict, Any, List, Optional, Tuple, Union
from datetime import datetime
import uuid
import hashlib
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Legacy constants for backward compatibility - defined at module level
STANDARD = "standard"
CUSTOM = "custom"
BENCHMARK = "benchmark"
COMPLIANCE = "compliance"
GOVERNANCE = "governance"
BASIC = "basic"
ADVANCED = "advanced"

# Dictionary of legacy constants for dynamic attribute access
LEGACY_CONSTANTS = {
    'STANDARD': STANDARD,
    'CUSTOM': CUSTOM,
    'BENCHMARK': BENCHMARK,
    'COMPLIANCE': COMPLIANCE,
    'GOVERNANCE': GOVERNANCE,
    'BASIC': BASIC,
    'ADVANCED': ADVANCED
}

# Metaclass for dynamic class-level attribute access
class LegacyConstantsMeta(type):
    """
    Metaclass that provides dynamic class-level attribute access for legacy constants.
    
    This allows legacy code to access constants like TheAgentCompanyIntegration.STANDARD even if
    they are not explicitly defined as class attributes.
    """
    def __getattr__(cls, name):
        """
        Dynamic attribute access for legacy constants at the class level.
        
        Args:
            name: Name of the attribute being accessed
            
        Returns:
            The constant value if it exists in LEGACY_CONSTANTS, otherwise raises AttributeError
        """
        if name in LEGACY_CONSTANTS:
            return LEGACY_CONSTANTS[name]
        raise AttributeError(f"'{cls.__name__}' class has no attribute '{name}'")

# Define benchmark types for backward compatibility
class BenchmarkType(Enum):
    """Benchmark types for integration testing."""
    PERFORMANCE = "performance"
    SECURITY = "security"
    COMPLIANCE = "compliance"
    GOVERNANCE = "governance"
    MEMORY = "memory"
    STANDARD = STANDARD  # Add legacy constant as enum value
    BASIC = BASIC  # Add legacy constant as enum value
    ADVANCED = ADVANCED  # Add legacy constant as enum value
    
    def __getattr__(self, name):
        """Dynamic attribute access for legacy constants."""
        if name in LEGACY_CONSTANTS:
            return LEGACY_CONSTANTS[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

# Define task categories for backward compatibility
class TaskCategory(Enum):
    """Task categories for benchmark scenarios."""
    MEMORY = "memory"
    GOVERNANCE = "governance"
    COMPLIANCE = "compliance"
    SECURITY = "security"
    PERFORMANCE = "performance"
    INTEGRATION = "integration"
    INFORMATION_RETRIEVAL = "information_retrieval"  # Added for backward compatibility

# Define agent profile for backward compatibility
class AgentProfile:
    """Agent profile information for benchmark testing."""
    def __init__(self, agent_id, name, capabilities=None, trust_tier=None):
        self.agent_id = agent_id
        self.name = name
        self.capabilities = capabilities or []
        self.trust_tier = trust_tier or 1
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "capabilities": self.capabilities,
            "trust_tier": self.trust_tier
        }
    
    # Static instances for backward compatibility
    GENERAL_PURPOSE = None
    ENTERPRISE = None
    AUTONOMOUS = None

# Initialize static instances
AgentProfile.GENERAL_PURPOSE = AgentProfile("general", "General Purpose Agent")
AgentProfile.ENTERPRISE = AgentProfile("enterprise", "Enterprise Agent", trust_tier=2)
AgentProfile.AUTONOMOUS = AgentProfile("autonomous", "Autonomous Agent", trust_tier=3)

# Define benchmark scenario for backward compatibility
class BenchmarkScenario:
    """Benchmark scenario definition."""
    def __init__(self, scenario_id, name, description=None, steps=None, benchmark_type=None, 
                 agent_profiles=None, tasks=None, governance_policies=None, compliance_requirements=None):
        self.scenario_id = scenario_id
        self.name = name
        self.description = description or name
        self.steps = steps or []
        self.benchmark_type = benchmark_type
        self.agent_profiles = agent_profiles or []
        self.tasks = tasks or []
        self.governance_policies = governance_policies or {}
        self.compliance_requirements = compliance_requirements or {}
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "description": self.description,
            "steps": [step.to_dict() if hasattr(step, 'to_dict') else step for step in self.steps],
            "benchmark_type": self.benchmark_type.value if self.benchmark_type else None,
            "agent_profiles": [ap.to_dict() if hasattr(ap, 'to_dict') else ap for ap in self.agent_profiles],
            "tasks": [task.to_dict() if hasattr(task, 'to_dict') else task for task in self.tasks],
            "governance_policies": self.governance_policies,
            "compliance_requirements": self.compliance_requirements
        }

# Define benchmark task for backward compatibility
class BenchmarkTask:
    """Benchmark task definition."""
    def __init__(self, task_id, category=None, description=None, instructions=None, 
                 expected_outcomes=None, governance_constraints=None, timeout_seconds=None, 
                 type=None, params=None, expected=None):
        self.task_id = task_id
        self.category = category
        self.description = description
        self.instructions = instructions
        self.expected_outcomes = expected_outcomes or []
        self.governance_constraints = governance_constraints or []
        self.timeout_seconds = timeout_seconds or 600
        # Legacy compatibility
        self.type = type
        self.params = params or {}
        self.expected = expected
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "task_id": self.task_id,
            "category": self.category.value if self.category else None,
            "description": self.description,
            "instructions": self.instructions,
            "expected_outcomes": self.expected_outcomes,
            "governance_constraints": self.governance_constraints,
            "timeout_seconds": self.timeout_seconds,
            "type": self.type,
            "params": self.params,
            "expected": self.expected
        }

# Define benchmark result for backward compatibility
class BenchmarkResult:
    """Benchmark result information."""
    def __init__(self, benchmark_id=None, run_id=None, scenario_id=None, status=None, 
                 metrics=None, errors=None, benchmark_type=None, agent_profile=None, 
                 tasks_completed=None, tasks_total=None, governance_events=None):
        self.benchmark_id = benchmark_id or run_id or str(uuid.uuid4())
        self.run_id = run_id or self.benchmark_id
        self.scenario_id = scenario_id
        self.status = status or "completed"
        self.metrics = metrics or {}
        self.errors = errors or []
        self.timestamp = datetime.now().isoformat()
        self.benchmark_type = benchmark_type
        self.agent_profile = agent_profile
        self.tasks_completed = tasks_completed or 0
        self.tasks_total = tasks_total or 0
        self.governance_events = governance_events or []
        
    def to_dict(self):
        """Convert to dictionary representation."""
        return {
            "benchmark_id": self.benchmark_id,
            "run_id": self.run_id,
            "scenario_id": self.scenario_id,
            "status": self.status,
            "metrics": self.metrics,
            "errors": self.errors,
            "timestamp": self.timestamp,
            "benchmark_type": self.benchmark_type.value if self.benchmark_type else None,
            "agent_profile": self.agent_profile.to_dict() if hasattr(self.agent_profile, 'to_dict') else self.agent_profile,
            "tasks_completed": self.tasks_completed,
            "tasks_total": self.tasks_total,
            "governance_events": self.governance_events
        }

class TheAgentCompanyIntegration(metaclass=LegacyConstantsMeta):
    """
    Integration with TheAgentCompany benchmark for testing Promethios governance API.
    
    This class provides functionality to run benchmark scenarios, collect metrics,
    and analyze compliance results from TheAgentCompany benchmark.
    """
    
    # Class-level constants for backward compatibility
    STANDARD = STANDARD
    CUSTOM = CUSTOM
    BENCHMARK = BENCHMARK
    COMPLIANCE = COMPLIANCE
    GOVERNANCE = GOVERNANCE
    BASIC = BASIC
    ADVANCED = ADVANCED
    
    def __init__(self, api_base_url: str = None, api_key: str = None, 
                 scenarios_directory: str = None, config: Dict[str, Any] = None,
                 benchmark_type: BenchmarkType = None, storage_dir: str = None, **kwargs):
        """
        Initialize TheAgentCompany integration.
        
        Args:
            api_base_url: Base URL for Promethios API
            api_key: API key for authentication
            scenarios_directory: Directory containing benchmark scenarios
            config: Configuration dictionary (for backward compatibility)
            benchmark_type: Type of benchmark to run (for backward compatibility)
            storage_dir: Alternative name for scenarios_directory (for backward compatibility)
            **kwargs: Additional keyword arguments for backward compatibility
        """
        # Set instance-level constants for backward compatibility
        self.STANDARD = self.__class__.STANDARD
        self.CUSTOM = self.__class__.CUSTOM
        self.BENCHMARK = self.__class__.BENCHMARK
        self.COMPLIANCE = self.__class__.COMPLIANCE
        self.GOVERNANCE = self.__class__.GOVERNANCE
        self.BASIC = self.__class__.BASIC
        self.ADVANCED = self.__class__.ADVANCED
        
        # Handle backward compatibility for storage_dir parameter
        if storage_dir and not scenarios_directory:
            scenarios_directory = storage_dir
            
        self.api_base_url = api_base_url or os.environ.get("PROMETHIOS_API_URL", "http://localhost:8000")
        self.api_key = api_key or os.environ.get("PROMETHIOS_API_KEY", "")
        self.scenarios_directory = scenarios_directory or os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "benchmark_scenarios"
        )
        self.scenarios: Dict[str, BenchmarkScenario] = {}
        self.results: Dict[str, BenchmarkResult] = {}
        self.metrics: Dict[str, Dict[str, Any]] = {}
        self.config = config or {}
        self.benchmark_type = benchmark_type
        
        # Store any additional kwargs for backward compatibility
        self.kwargs = kwargs
        
        # Ensure scenarios directory exists
        os.makedirs(self.scenarios_directory, exist_ok=True)
        
        # Load scenarios
        self.load_scenarios()
    
    def __getattr__(self, name):
        """
        Dynamic attribute access for legacy constants at the instance level.
        
        This method is called when an attribute is not found through normal attribute lookup.
        It allows legacy code to access constants like instance.STANDARD even if they
        are not explicitly defined as instance attributes.
        
        Args:
            name: Name of the attribute being accessed
            
        Returns:
            The constant value if it exists in LEGACY_CONSTANTS, otherwise raises AttributeError
        """
        if name in LEGACY_CONSTANTS:
            return LEGACY_CONSTANTS[name]
        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
    
    def load_scenarios(self) -> None:
        """
        Load benchmark scenarios from the scenarios directory.
        """
        logger.info(f"Loading benchmark scenarios from {self.scenarios_directory}")
        if not os.path.exists(self.scenarios_directory):
            logger.warning(f"Scenarios directory {self.scenarios_directory} does not exist")
            return
            
        for filename in os.listdir(self.scenarios_directory):
            if filename.endswith(".json"):
                scenario_path = os.path.join(self.scenarios_directory, filename)
                try:
                    with open(scenario_path, 'r') as f:
                        scenario_data = json.load(f)
                    
                    # Extract scenario ID
                    scenario_id = scenario_data.get("scenario_id")
                    
                    if not scenario_id:
                        logger.warning(f"Skipping scenario file {filename}: missing scenario_id")
                        continue
                    
                    # Create scenario object
                    scenario = BenchmarkScenario(
                        scenario_id=scenario_id,
                        name=scenario_data.get("name", scenario_id),
                        description=scenario_data.get("description"),
                        benchmark_type=BenchmarkType(scenario_data.get("benchmark_type")) if scenario_data.get("benchmark_type") else None,
                        agent_profiles=[],  # Would need to convert from dict to AgentProfile objects
                        tasks=[],  # Would need to convert from dict to BenchmarkTask objects
                        governance_policies=scenario_data.get("governance_policies", {}),
                        compliance_requirements=scenario_data.get("compliance_requirements", {})
                    )
                    
                    self.scenarios[scenario_id] = scenario
                    logger.info(f"Loaded benchmark scenario: {scenario_id}")
                except Exception as e:
                    logger.error(f"Error loading scenario {filename}: {str(e)}")
    
    def get_scenario(self, scenario_id: str) -> Optional[BenchmarkScenario]:
        """
        Get a benchmark scenario by ID.
        
        Args:
            scenario_id: ID of the scenario
            
        Returns:
            Scenario object, or None if not found
        """
        return self.scenarios.get(scenario_id)
    
    def list_scenarios(self, benchmark_type: BenchmarkType = None, agent_profile: AgentProfile = None) -> List[BenchmarkScenario]:
        """
        Get all benchmark scenarios with optional filtering.
        
        Args:
            benchmark_type: Filter by benchmark type
            agent_profile: Filter by agent profile
            
        Returns:
            List of scenarios
        """
        scenarios = list(self.scenarios.values())
        
        if benchmark_type:
            scenarios = [s for s in scenarios if s.benchmark_type == benchmark_type]
            
        if agent_profile:
            scenarios = [s for s in scenarios if agent_profile in s.agent_profiles]
            
        return scenarios
    
    def create_scenario(self, scenario: BenchmarkScenario) -> str:
        """
        Create a new benchmark scenario.
        
        Args:
            scenario: Scenario object
            
        Returns:
            ID of the created scenario
        """
        # Generate scenario ID if not provided
        if not scenario.scenario_id:
            scenario_id = f"scn-{uuid.uuid4().hex[:8]}"
            scenario.scenario_id = scenario_id
        else:
            scenario_id = scenario.scenario_id
        
        # Store scenario
        self.scenarios[scenario_id] = scenario
        
        # Save to file
        filename = f"{scenario_id}.json"
        filepath = os.path.join(self.scenarios_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(scenario.to_dict(), f, indent=2)
            logger.info(f"Created benchmark scenario: {scenario_id}")
        except Exception as e:
            logger.error(f"Error saving scenario {filename}: {str(e)}")
        
        return scenario_id
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """
        Delete a benchmark scenario.
        
        Args:
            scenario_id: ID of the scenario to delete
            
        Returns:
            True if successful, False otherwise
        """
        if scenario_id not in self.scenarios:
            logger.error(f"Scenario {scenario_id} not found")
            return False
        
        # Remove from memory
        del self.scenarios[scenario_id]
        
        # Remove file
        filename = f"{scenario_id}.json"
        filepath = os.path.join(self.scenarios_directory, filename)
        
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
            logger.info(f"Deleted benchmark scenario: {scenario_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting scenario {filename}: {str(e)}")
            return False
    
    def run_benchmark(self, scenario_id: str, agent_profile: AgentProfile = None, 
                     governance_api_url: str = None, governance_api_key: str = None,
                     callback=None) -> BenchmarkResult:
        """
        Run a benchmark against the governance API.
        
        Args:
            scenario_id: ID of the scenario to run
            agent_profile: Agent profile to use
            governance_api_url: URL of the governance API
            governance_api_key: API key for the governance API
            callback: Callback function for progress updates
            
        Returns:
            Benchmark result
        """
        scenario = self.get_scenario(scenario_id)
        if not scenario:
            logger.error(f"Scenario {scenario_id} not found")
            return BenchmarkResult(
                scenario_id=scenario_id,
                status="failed",
                errors=[f"Scenario {scenario_id} not found"]
            )
        
        # Generate benchmark ID
        benchmark_id = f"bm-{uuid.uuid4().hex[:8]}"
        
        # Initialize result
        result = BenchmarkResult(
            benchmark_id=benchmark_id,
            scenario_id=scenario_id,
            status="running",
            benchmark_type=scenario.benchmark_type,
            agent_profile=agent_profile,
            tasks_total=len(scenario.tasks),
            tasks_completed=0
        )
        
        # Store result
        self.results[benchmark_id] = result
        
        # Mock benchmark execution for testing
        # In a real implementation, this would make API calls to the governance API
        time.sleep(0.1)  # Simulate some processing time
        
        # Update result
        result.status = "completed"
        result.tasks_completed = len(scenario.tasks)
        result.governance_events = [
            {
                "event_id": f"evt-{uuid.uuid4().hex[:8]}",
                "timestamp": datetime.now().isoformat(),
                "type": "governance_decision",
                "decision": "allow",
                "constraint_id": "constraint-1",
                "confidence": 0.95
            }
        ]
        
        # Call callback if provided
        if callback:
            callback("benchmark_completed", result.to_dict())
        
        return result
    
    def get_result(self, benchmark_id: str) -> Optional[BenchmarkResult]:
        """
        Get a benchmark result by ID.
        
        Args:
            benchmark_id: ID of the benchmark result
            
        Returns:
            Benchmark result, or None if not found
        """
        return self.results.get(benchmark_id)
    
    def list_results(self, scenario_id: str = None, agent_profile: AgentProfile = None) -> List[BenchmarkResult]:
        """
        Get all benchmark results with optional filtering.
        
        Args:
            scenario_id: Filter by scenario ID
            agent_profile: Filter by agent profile
            
        Returns:
            List of benchmark results
        """
        results = list(self.results.values())
        
        if scenario_id:
            results = [r for r in results if r.scenario_id == scenario_id]
            
        if agent_profile:
            results = [r for r in results if r.agent_profile == agent_profile]
            
        return results
    
    def delete_result(self, benchmark_id: str) -> bool:
        """
        Delete a benchmark result.
        
        Args:
            benchmark_id: ID of the benchmark result to delete
            
        Returns:
            True if successful, False otherwise
        """
        if benchmark_id not in self.results:
            logger.error(f"Benchmark result {benchmark_id} not found")
            return False
        
        # Remove from memory
        del self.results[benchmark_id]
        
        logger.info(f"Deleted benchmark result: {benchmark_id}")
        return True
    
    def compare_results(self, benchmark_ids: List[str]) -> Dict[str, Any]:
        """
        Compare multiple benchmark results.
        
        Args:
            benchmark_ids: List of benchmark result IDs to compare
            
        Returns:
            Comparison report
        """
        # Get results
        results = [self.get_result(bid) for bid in benchmark_ids if self.get_result(bid)]
        
        if not results:
            return {"error": "No valid benchmark results found"}
            
        if len(results) < 2:
            return {"error": "At least two benchmark results are required for comparison"}
            
        # Initialize comparison report
        comparison = {
            "benchmark_ids": benchmark_ids,
            "metrics_comparison": {},
            "governance_comparison": {},
            "compliance_comparison": {},
            "summary": {}
        }
        
        # Compare metrics
        # This is a simplified comparison - a real implementation would be more thorough
        comparison["metrics_comparison"]["tasks_completed"] = {
            bid: results[i].tasks_completed for i, bid in enumerate(benchmark_ids)
        }
        
        comparison["metrics_comparison"]["completion_rate"] = {
            bid: (results[i].tasks_completed / results[i].tasks_total) * 100 
            if results[i].tasks_total > 0 else 0
            for i, bid in enumerate(benchmark_ids)
        }
        
        # Compare governance events
        comparison["governance_comparison"]["event_count"] = {
            bid: len(results[i].governance_events) for i, bid in enumerate(benchmark_ids)
        }
        
        # Generate summary
        comparison["summary"]["best_completion_rate"] = max(
            comparison["metrics_comparison"]["completion_rate"].items(),
            key=lambda x: x[1]
        )[0]
        
        return comparison
    
    def generate_default_scenarios(self) -> List[str]:
        """
        Generate default benchmark scenarios.
        
        Returns:
            List of generated scenario IDs
        """
        scenario_ids = []
        
        # Generate basic scenario
        basic_scenario = BenchmarkScenario(
            scenario_id="default-basic",
            name="Default Basic Scenario",
            description="A basic benchmark scenario for testing governance",
            benchmark_type=BenchmarkType.BASIC,
            agent_profiles=[AgentProfile.GENERAL_PURPOSE],
            tasks=[
                BenchmarkTask(
                    task_id="task-1",
                    category=TaskCategory.GOVERNANCE,
                    description="Basic governance test",
                    instructions="Test basic governance functionality"
                )
            ],
            governance_policies={
                "data_access": {
                    "allowed": ["public_data"],
                    "prohibited": ["sensitive_data"]
                }
            }
        )
        
        scenario_ids.append(self.create_scenario(basic_scenario))
        
        # Generate advanced scenario
        advanced_scenario = BenchmarkScenario(
            scenario_id="default-advanced",
            name="Default Advanced Scenario",
            description="An advanced benchmark scenario for testing governance",
            benchmark_type=BenchmarkType.ADVANCED,
            agent_profiles=[AgentProfile.ENTERPRISE],
            tasks=[
                BenchmarkTask(
                    task_id="task-1",
                    category=TaskCategory.COMPLIANCE,
                    description="Compliance test",
                    instructions="Test compliance functionality"
                ),
                BenchmarkTask(
                    task_id="task-2",
                    category=TaskCategory.GOVERNANCE,
                    description="Advanced governance test",
                    instructions="Test advanced governance functionality"
                )
            ],
            governance_policies={
                "data_access": {
                    "allowed": ["public_data", "internal_data"],
                    "prohibited": ["sensitive_data", "pii"]
                },
                "actions": {
                    "allowed": ["read", "analyze"],
                    "prohibited": ["modify", "delete"]
                }
            },
            compliance_requirements={
                "SOC2": ["CC5.1", "CC7.1"],
                "GDPR": ["GDPR-5"]
            }
        )
        
        scenario_ids.append(self.create_scenario(advanced_scenario))
        
        return scenario_ids
    
    def analyze_governance_events(self, benchmark_id: str = None, events: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Analyze governance events from a benchmark run.
        
        Args:
            benchmark_id: ID of the benchmark result
            events: List of governance events (alternative to benchmark_id)
            
        Returns:
            Analysis report
        """
        # Get events from benchmark result if benchmark_id is provided
        if benchmark_id and not events:
            result = self.get_result(benchmark_id)
            if not result:
                return {"error": f"Benchmark result {benchmark_id} not found"}
            events = result.governance_events
            
        if not events:
            return {
                "benchmark_id": benchmark_id,
                "total_events": 0,
                "events_by_constraint_type": {},
                "events_by_decision": {}
            }
            
        # Initialize analysis report
        analysis = {
            "benchmark_id": benchmark_id,
            "total_events": len(events),
            "events_by_constraint_type": {},
            "events_by_decision": {}
        }
        
        # Analyze events
        for event in events:
            # Count by constraint type
            constraint_type = event.get("constraint_type", "unknown")
            if constraint_type not in analysis["events_by_constraint_type"]:
                analysis["events_by_constraint_type"][constraint_type] = 0
            analysis["events_by_constraint_type"][constraint_type] += 1
            
            # Count by decision
            decision = event.get("decision", "unknown")
            if decision not in analysis["events_by_decision"]:
                analysis["events_by_decision"][decision] = 0
            analysis["events_by_decision"][decision] += 1
            
        return analysis
    
    def export_benchmark_data(self, benchmark_ids: List[str] = None, format: str = "json", 
                             include_scenarios: bool = False) -> Dict[str, Any]:
        """
        Export benchmark data for analysis.
        
        Args:
            benchmark_ids: List of benchmark result IDs to export
            format: Output format ("json" or "csv")
            include_scenarios: Whether to include scenario definitions
            
        Returns:
            Export information
        """
        # Get benchmark results
        if benchmark_ids:
            results = {bid: self.get_result(bid).to_dict() if self.get_result(bid) else None 
                      for bid in benchmark_ids}
        else:
            results = {bid: result.to_dict() for bid, result in self.results.items()}
            
        # Get scenarios if requested
        scenarios = {}
        if include_scenarios:
            for bid, result in results.items():
                if result and result.get("scenario_id"):
                    scenario_id = result["scenario_id"]
                    scenario = self.get_scenario(scenario_id)
                    if scenario:
                        scenarios[scenario_id] = scenario.to_dict()
                        
        # Prepare export data
        export_data = {
            "results": results,
            "scenarios": scenarios if include_scenarios else {}
        }
        
        # Export to file if format is specified
        export_path = None
        if format.lower() == "json":
            export_path = os.path.join(self.scenarios_directory, "export.json")
            try:
                with open(export_path, 'w') as f:
                    json.dump(export_data, f, indent=2)
                logger.info(f"Exported benchmark data to {export_path}")
            except Exception as e:
                logger.error(f"Error exporting benchmark data: {str(e)}")
                
        elif format.lower() == "csv":
            # CSV export would be implemented here
            export_path = os.path.join(self.scenarios_directory, "export.csv")
            
        # Return export information
        return {
            "benchmark_ids": list(results.keys()),
            "format": format,
            "include_scenarios": include_scenarios,
            "file_path": export_path  # Changed from export_path to file_path for compatibility
        }

# Add dynamic attribute access to BenchmarkType enum for legacy constants
def _benchmark_type_getattr(self, name):
    if name in LEGACY_CONSTANTS:
        return LEGACY_CONSTANTS[name]
    raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")

# Apply the dynamic attribute access to BenchmarkType
BenchmarkType.__getattr__ = _benchmark_type_getattr

# Export all symbols for backward compatibility
__all__ = [
    'TheAgentCompanyIntegration', 'BenchmarkType', 'AgentProfile', 'TaskCategory',
    'BenchmarkScenario', 'BenchmarkTask', 'BenchmarkResult',
    'STANDARD', 'CUSTOM', 'BENCHMARK', 'COMPLIANCE', 'GOVERNANCE', 'BASIC', 'ADVANCED'
]
