"""
Workflow Registry for Promethios.

This module provides comprehensive workflow management within the Promethios
governance system. It enables multi-agent workflows to be defined, orchestrated,
tracked, and optimized with full governance integration.
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple
from enum import Enum
import uuid

# Configure logging
logger = logging.getLogger(__name__)

class WorkflowType(Enum):
    """Workflow type enumeration."""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    CONDITIONAL = "conditional"
    LOOP = "loop"
    HYBRID = "hybrid"
    COLLABORATIVE = "collaborative"

class WorkflowStatus(Enum):
    """Workflow status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskType(Enum):
    """Task type enumeration."""
    AGENT_TASK = "agent_task"
    TOOL_INVOCATION = "tool_invocation"
    MODEL_INFERENCE = "model_inference"
    DECISION_POINT = "decision_point"
    SYNCHRONIZATION = "synchronization"
    GOVERNANCE_CHECK = "governance_check"

class WorkflowStep(NamedTuple):
    """Workflow step definition."""
    step_id: str
    name: str
    task_type: str
    agent_id: Optional[str]
    tool_id: Optional[str]
    model_id: Optional[str]
    parameters: Dict[str, Any]
    dependencies: List[str]
    governance_requirements: Dict[str, Any]

class WorkflowExecution(NamedTuple):
    """Workflow execution instance."""
    execution_id: str
    workflow_id: str
    status: str
    start_time: str
    end_time: Optional[str]
    current_step: Optional[str]
    results: Dict[str, Any]
    governance_scores: Dict[str, float]

class WorkflowRegistrationResult(NamedTuple):
    """Result of workflow registration."""
    success: bool
    workflow_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class WorkflowExecutionResult(NamedTuple):
    """Result of workflow execution."""
    success: bool
    execution_id: Optional[str] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time: float = 0.0
    governance_summary: Optional[Dict[str, float]] = None

class WorkflowRegistry:
    """Registry for managing workflow lifecycle and orchestration."""
    
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
        """Initialize the workflow registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
            agent_registry: Optional agent registry for agent coordination.
            tool_registry: Optional tool registry for tool invocation.
            model_registry: Optional model registry for model inference.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.agent_registry = agent_registry
        self.tool_registry = tool_registry
        self.model_registry = model_registry
        self.workflows = {}
        self.workflow_executions = {}
        self.workflow_templates = {}
        self.workflow_analytics = {}
        
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
                    logger.error("Workflow registry file seal verification failed")
                    raise ValueError("Workflow registry file seal verification failed")
                
                # Load registry data
                self.workflows = data.get("workflows", {})
                self.workflow_executions = data.get("workflow_executions", {})
                self.workflow_templates = data.get("workflow_templates", {})
                self.workflow_analytics = data.get("workflow_analytics", {})
                
                logger.info(f"Loaded {len(self.workflows)} workflows from registry")
            except Exception as e:
                logger.error(f"Error loading workflow registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.workflows = {}
        self.workflow_executions = {}
        self.workflow_templates = {}
        self.workflow_analytics = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_workflow_registry",
            "workflows": self.workflows,
            "workflow_executions": self.workflow_executions,
            "workflow_templates": self.workflow_templates,
            "workflow_analytics": self.workflow_analytics
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.workflows)} workflows to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state
        state_data = {
            "workflows": self.workflows,
            "workflow_executions": self.workflow_executions,
            "workflow_templates": self.workflow_templates,
            "workflow_analytics": self.workflow_analytics
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_workflow(self, workflow_data: Dict[str, Any]) -> WorkflowRegistrationResult:
        """Register a new workflow.
        
        Args:
            workflow_data: Data for the workflow to register.
                Must include workflow_id, name, description, workflow_type, steps,
                and governance configuration.
                
        Returns:
            WorkflowRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_workflow",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return WorkflowRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the workflow data
            validation_result = self.schema_validator.validate(workflow_data, "workflow_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Workflow validation failed: {validation_result.errors}")
                return WorkflowRegistrationResult(
                    success=False,
                    error=f"Workflow validation failed: {validation_result.errors}"
                )
            
            # Check if the workflow already exists
            workflow_id = workflow_data["workflow_id"]
            if workflow_id in self.workflows:
                logger.error(f"Workflow {workflow_id} already exists")
                return WorkflowRegistrationResult(
                    success=False,
                    error=f"Workflow {workflow_id} already exists"
                )
            
            # Validate workflow dependencies
            validation_errors = self._validate_workflow_dependencies(workflow_data)
            if validation_errors:
                return WorkflowRegistrationResult(
                    success=False,
                    error=f"Workflow dependency validation failed: {validation_errors}"
                )
            
            # Prepare the workflow data
            registration_timestamp = datetime.utcnow().isoformat()
            workflow = {
                "workflow_id": workflow_id,
                "name": workflow_data["name"],
                "description": workflow_data["description"],
                "workflow_type": workflow_data["workflow_type"],
                "version": workflow_data.get("version", "1.0.0"),
                "author": workflow_data.get("author", "unknown"),
                "steps": workflow_data["steps"],
                "governance_config": workflow_data.get("governance_config", {}),
                "metadata": workflow_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": WorkflowStatus.DRAFT.value,
                "execution_count": 0,
                "last_executed": None
            }
            
            # Create a seal for the workflow
            workflow["seal"] = self.seal_verification_service.create_seal(workflow)
            
            # Add the workflow to the registry
            self.workflows[workflow_id] = workflow
            
            # Initialize workflow analytics
            self.workflow_analytics[workflow_id] = {
                "total_executions": 0,
                "successful_executions": 0,
                "failed_executions": 0,
                "average_execution_time": 0.0,
                "average_governance_score": 0.0,
                "step_performance": {},
                "execution_history": []
            }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered workflow {workflow_id}")
            return WorkflowRegistrationResult(
                success=True,
                workflow_id=workflow_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering workflow: {str(e)}")
            return WorkflowRegistrationResult(
                success=False,
                error=f"Error registering workflow: {str(e)}"
            )
    
    def _validate_workflow_dependencies(self, workflow_data: Dict[str, Any]) -> List[str]:
        """Validate workflow dependencies.
        
        Args:
            workflow_data: Workflow data to validate.
            
        Returns:
            List of validation errors.
        """
        errors = []
        steps = workflow_data.get("steps", [])
        
        for step in steps:
            step_id = step.get("step_id")
            task_type = step.get("task_type")
            
            # Validate agent dependencies
            if task_type == TaskType.AGENT_TASK.value:
                agent_id = step.get("agent_id")
                if agent_id and self.agent_registry and not self.agent_registry.check_agent_exists(agent_id):
                    errors.append(f"Step {step_id}: Agent {agent_id} does not exist")
            
            # Validate tool dependencies
            elif task_type == TaskType.TOOL_INVOCATION.value:
                tool_id = step.get("tool_id")
                if tool_id and self.tool_registry and not self.tool_registry.check_tool_exists(tool_id):
                    errors.append(f"Step {step_id}: Tool {tool_id} does not exist")
            
            # Validate model dependencies
            elif task_type == TaskType.MODEL_INFERENCE.value:
                model_id = step.get("model_id")
                if model_id and self.model_registry and not self.model_registry.check_model_exists(model_id):
                    errors.append(f"Step {step_id}: Model {model_id} does not exist")
            
            # Validate step dependencies
            dependencies = step.get("dependencies", [])
            step_ids = [s.get("step_id") for s in steps]
            for dep in dependencies:
                if dep not in step_ids:
                    errors.append(f"Step {step_id}: Dependency {dep} does not exist in workflow")
        
        return errors
    
    def execute_workflow(self, workflow_id: str, input_data: Dict[str, Any], 
                        execution_config: Optional[Dict[str, Any]] = None) -> WorkflowExecutionResult:
        """Execute a workflow.
        
        Args:
            workflow_id: ID of the workflow to execute.
            input_data: Input data for the workflow execution.
            execution_config: Optional execution configuration.
            
        Returns:
            WorkflowExecutionResult with success status and results.
        """
        start_time = datetime.utcnow()
        execution_id = str(uuid.uuid4())
        
        try:
            # Check if the workflow exists
            if workflow_id not in self.workflows:
                return WorkflowExecutionResult(
                    success=False,
                    error=f"Workflow {workflow_id} does not exist"
                )
            
            workflow = self.workflows[workflow_id]
            
            # Check if workflow is active
            if workflow.get("status") != WorkflowStatus.ACTIVE.value:
                return WorkflowExecutionResult(
                    success=False,
                    error=f"Workflow {workflow_id} is not active (status: {workflow.get('status')})"
                )
            
            # Create workflow execution record
            execution = {
                "execution_id": execution_id,
                "workflow_id": workflow_id,
                "status": WorkflowStatus.RUNNING.value,
                "start_time": start_time.isoformat(),
                "end_time": None,
                "current_step": None,
                "input_data": input_data,
                "execution_config": execution_config or {},
                "step_results": {},
                "governance_scores": {},
                "error_log": []
            }
            
            self.workflow_executions[execution_id] = execution
            
            # Execute workflow steps
            results = self._execute_workflow_steps(workflow, execution, input_data)
            
            # Calculate execution time
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            # Update execution record
            execution["status"] = WorkflowStatus.COMPLETED.value if results["success"] else WorkflowStatus.FAILED.value
            execution["end_time"] = end_time.isoformat()
            execution["results"] = results
            
            # Calculate governance summary
            governance_summary = self._calculate_governance_summary(execution)
            execution["governance_summary"] = governance_summary
            
            # Update workflow analytics
            self._update_workflow_analytics(workflow_id, results["success"], execution_time, governance_summary)
            
            # Save the updated registry
            self._save_registry()
            
            return WorkflowExecutionResult(
                success=results["success"],
                execution_id=execution_id,
                results=results,
                error=results.get("error"),
                execution_time=execution_time,
                governance_summary=governance_summary
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            # Update execution record with error
            if execution_id in self.workflow_executions:
                self.workflow_executions[execution_id]["status"] = WorkflowStatus.FAILED.value
                self.workflow_executions[execution_id]["end_time"] = end_time.isoformat()
                self.workflow_executions[execution_id]["error_log"].append(str(e))
            
            logger.error(f"Error executing workflow {workflow_id}: {str(e)}")
            return WorkflowExecutionResult(
                success=False,
                execution_id=execution_id,
                error=f"Error executing workflow: {str(e)}",
                execution_time=execution_time
            )
    
    def _execute_workflow_steps(self, workflow: Dict[str, Any], execution: Dict[str, Any], 
                               input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow steps.
        
        Args:
            workflow: Workflow definition.
            execution: Execution record.
            input_data: Input data for execution.
            
        Returns:
            Execution results.
        """
        steps = workflow["steps"]
        workflow_type = workflow["workflow_type"]
        step_results = {}
        governance_scores = {}
        
        try:
            if workflow_type == WorkflowType.SEQUENTIAL.value:
                results = self._execute_sequential_workflow(steps, execution, input_data)
            elif workflow_type == WorkflowType.PARALLEL.value:
                results = self._execute_parallel_workflow(steps, execution, input_data)
            elif workflow_type == WorkflowType.COLLABORATIVE.value:
                results = self._execute_collaborative_workflow(steps, execution, input_data)
            else:
                results = self._execute_hybrid_workflow(steps, execution, input_data)
            
            return {
                "success": True,
                "step_results": results.get("step_results", {}),
                "governance_scores": results.get("governance_scores", {}),
                "final_output": results.get("final_output", {})
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "step_results": step_results,
                "governance_scores": governance_scores
            }
    
    def _execute_sequential_workflow(self, steps: List[Dict[str, Any]], execution: Dict[str, Any], 
                                   input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow steps sequentially.
        
        Args:
            steps: List of workflow steps.
            execution: Execution record.
            input_data: Input data.
            
        Returns:
            Execution results.
        """
        step_results = {}
        governance_scores = {}
        current_data = input_data.copy()
        
        for step in steps:
            step_id = step["step_id"]
            execution["current_step"] = step_id
            
            # Execute step
            step_result = self._execute_step(step, current_data, execution)
            step_results[step_id] = step_result
            
            # Update governance scores
            if step_result.get("governance_score"):
                governance_scores[step_id] = step_result["governance_score"]
            
            # Check if step failed
            if not step_result.get("success", False):
                raise Exception(f"Step {step_id} failed: {step_result.get('error', 'Unknown error')}")
            
            # Update current data with step output
            if step_result.get("output"):
                current_data.update(step_result["output"])
        
        return {
            "step_results": step_results,
            "governance_scores": governance_scores,
            "final_output": current_data
        }
    
    def _execute_parallel_workflow(self, steps: List[Dict[str, Any]], execution: Dict[str, Any], 
                                 input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow steps in parallel.
        
        Args:
            steps: List of workflow steps.
            execution: Execution record.
            input_data: Input data.
            
        Returns:
            Execution results.
        """
        step_results = {}
        governance_scores = {}
        
        # For simplicity, we'll simulate parallel execution sequentially
        # In a real implementation, this would use threading or async execution
        for step in steps:
            step_id = step["step_id"]
            execution["current_step"] = step_id
            
            # Execute step
            step_result = self._execute_step(step, input_data, execution)
            step_results[step_id] = step_result
            
            # Update governance scores
            if step_result.get("governance_score"):
                governance_scores[step_id] = step_result["governance_score"]
        
        # Combine results
        final_output = input_data.copy()
        for step_id, result in step_results.items():
            if result.get("success") and result.get("output"):
                final_output[f"{step_id}_output"] = result["output"]
        
        return {
            "step_results": step_results,
            "governance_scores": governance_scores,
            "final_output": final_output
        }
    
    def _execute_collaborative_workflow(self, steps: List[Dict[str, Any]], execution: Dict[str, Any], 
                                      input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow steps collaboratively.
        
        Args:
            steps: List of workflow steps.
            execution: Execution record.
            input_data: Input data.
            
        Returns:
            Execution results.
        """
        step_results = {}
        governance_scores = {}
        collaboration_data = input_data.copy()
        
        # Group steps by collaboration phase
        collaboration_phases = self._group_steps_by_collaboration(steps)
        
        for phase_id, phase_steps in collaboration_phases.items():
            phase_results = {}
            
            # Execute all steps in the phase
            for step in phase_steps:
                step_id = step["step_id"]
                execution["current_step"] = step_id
                
                # Execute step with collaboration context
                step_result = self._execute_step(step, collaboration_data, execution)
                step_results[step_id] = step_result
                phase_results[step_id] = step_result
                
                # Update governance scores
                if step_result.get("governance_score"):
                    governance_scores[step_id] = step_result["governance_score"]
            
            # Synthesize phase results
            phase_synthesis = self._synthesize_collaboration_phase(phase_results, collaboration_data)
            collaboration_data.update(phase_synthesis)
        
        return {
            "step_results": step_results,
            "governance_scores": governance_scores,
            "final_output": collaboration_data
        }
    
    def _execute_hybrid_workflow(self, steps: List[Dict[str, Any]], execution: Dict[str, Any], 
                                input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow steps using hybrid approach.
        
        Args:
            steps: List of workflow steps.
            execution: Execution record.
            input_data: Input data.
            
        Returns:
            Execution results.
        """
        # For hybrid workflows, we'll use sequential execution as default
        return self._execute_sequential_workflow(steps, execution, input_data)
    
    def _execute_step(self, step: Dict[str, Any], input_data: Dict[str, Any], 
                     execution: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single workflow step.
        
        Args:
            step: Step definition.
            input_data: Input data for the step.
            execution: Execution record.
            
        Returns:
            Step execution result.
        """
        step_id = step["step_id"]
        task_type = step["task_type"]
        parameters = step.get("parameters", {})
        
        try:
            if task_type == TaskType.AGENT_TASK.value:
                return self._execute_agent_task(step, input_data, execution)
            elif task_type == TaskType.TOOL_INVOCATION.value:
                return self._execute_tool_invocation(step, input_data, execution)
            elif task_type == TaskType.MODEL_INFERENCE.value:
                return self._execute_model_inference(step, input_data, execution)
            elif task_type == TaskType.GOVERNANCE_CHECK.value:
                return self._execute_governance_check(step, input_data, execution)
            else:
                return {
                    "success": False,
                    "error": f"Unknown task type: {task_type}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": f"Step execution failed: {str(e)}"
            }
    
    def _execute_agent_task(self, step: Dict[str, Any], input_data: Dict[str, Any], 
                           execution: Dict[str, Any]) -> Dict[str, Any]:
        """Execute an agent task step.
        
        Args:
            step: Step definition.
            input_data: Input data.
            execution: Execution record.
            
        Returns:
            Step execution result.
        """
        agent_id = step.get("agent_id")
        parameters = step.get("parameters", {})
        
        # Simulate agent task execution
        # In a real implementation, this would invoke the actual agent
        result = {
            "success": True,
            "output": {
                "agent_response": f"Agent {agent_id} completed task with parameters: {parameters}",
                "agent_id": agent_id,
                "task_result": "completed"
            },
            "governance_score": 0.85
        }
        
        return result
    
    def _execute_tool_invocation(self, step: Dict[str, Any], input_data: Dict[str, Any], 
                                execution: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a tool invocation step.
        
        Args:
            step: Step definition.
            input_data: Input data.
            execution: Execution record.
            
        Returns:
            Step execution result.
        """
        tool_id = step.get("tool_id")
        parameters = step.get("parameters", {})
        
        # Use tool registry if available
        if self.tool_registry:
            tool_result = self.tool_registry.invoke_tool(tool_id, parameters)
            return {
                "success": tool_result.success,
                "output": tool_result.output,
                "error": tool_result.error,
                "governance_score": tool_result.governance_score
            }
        else:
            # Simulate tool invocation
            return {
                "success": True,
                "output": {
                    "tool_response": f"Tool {tool_id} executed with parameters: {parameters}",
                    "tool_id": tool_id,
                    "result": "completed"
                },
                "governance_score": 0.90
            }
    
    def _execute_model_inference(self, step: Dict[str, Any], input_data: Dict[str, Any], 
                                execution: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a model inference step.
        
        Args:
            step: Step definition.
            input_data: Input data.
            execution: Execution record.
            
        Returns:
            Step execution result.
        """
        model_id = step.get("model_id")
        parameters = step.get("parameters", {})
        
        # Use model registry if available
        if self.model_registry:
            inference_result = self.model_registry.inference(model_id, parameters)
            governance_score = 0.0
            if inference_result.governance_metrics:
                governance_score = sum(inference_result.governance_metrics.values()) / len(inference_result.governance_metrics)
            
            return {
                "success": inference_result.success,
                "output": inference_result.output,
                "error": inference_result.error,
                "governance_score": governance_score
            }
        else:
            # Simulate model inference
            return {
                "success": True,
                "output": {
                    "model_response": f"Model {model_id} inference with parameters: {parameters}",
                    "model_id": model_id,
                    "generated_text": "Model output text",
                    "confidence": 0.88
                },
                "governance_score": 0.87
            }
    
    def _execute_governance_check(self, step: Dict[str, Any], input_data: Dict[str, Any], 
                                 execution: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a governance check step.
        
        Args:
            step: Step definition.
            input_data: Input data.
            execution: Execution record.
            
        Returns:
            Step execution result.
        """
        governance_requirements = step.get("governance_requirements", {})
        
        # Use governance integration if available
        if self.governance_integration:
            governance_result = self.governance_integration.evaluate_workflow_step(
                execution["workflow_id"], step, input_data
            )
            return {
                "success": governance_result.get("compliant", True),
                "output": governance_result,
                "governance_score": governance_result.get("overall_score", 1.0)
            }
        else:
            # Simulate governance check
            return {
                "success": True,
                "output": {
                    "governance_check": "passed",
                    "requirements_met": governance_requirements,
                    "compliance_score": 0.92
                },
                "governance_score": 0.92
            }
    
    def _group_steps_by_collaboration(self, steps: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group steps by collaboration phase.
        
        Args:
            steps: List of workflow steps.
            
        Returns:
            Dictionary mapping phase IDs to step lists.
        """
        # Simple grouping by collaboration phase (could be more sophisticated)
        phases = {"phase_1": steps}
        return phases
    
    def _synthesize_collaboration_phase(self, phase_results: Dict[str, Any], 
                                      collaboration_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesize results from a collaboration phase.
        
        Args:
            phase_results: Results from all steps in the phase.
            collaboration_data: Current collaboration data.
            
        Returns:
            Synthesized phase results.
        """
        synthesis = {
            "phase_summary": "Collaboration phase completed",
            "step_count": len(phase_results),
            "success_rate": sum(1 for r in phase_results.values() if r.get("success", False)) / len(phase_results)
        }
        
        # Combine outputs from successful steps
        combined_output = {}
        for step_id, result in phase_results.items():
            if result.get("success") and result.get("output"):
                combined_output[f"{step_id}_output"] = result["output"]
        
        synthesis["combined_output"] = combined_output
        return synthesis
    
    def _calculate_governance_summary(self, execution: Dict[str, Any]) -> Dict[str, float]:
        """Calculate governance summary for workflow execution.
        
        Args:
            execution: Execution record.
            
        Returns:
            Governance summary scores.
        """
        governance_scores = execution.get("governance_scores", {})
        
        if not governance_scores:
            return {
                "overall_governance_score": 0.0,
                "step_count": 0,
                "average_score": 0.0
            }
        
        scores = list(governance_scores.values())
        return {
            "overall_governance_score": sum(scores) / len(scores),
            "step_count": len(scores),
            "average_score": sum(scores) / len(scores),
            "min_score": min(scores),
            "max_score": max(scores)
        }
    
    def _update_workflow_analytics(self, workflow_id: str, success: bool, execution_time: float, 
                                  governance_summary: Dict[str, float]):
        """Update workflow analytics.
        
        Args:
            workflow_id: ID of the workflow.
            success: Whether the execution was successful.
            execution_time: Execution time in seconds.
            governance_summary: Governance summary scores.
        """
        if workflow_id not in self.workflow_analytics:
            self.workflow_analytics[workflow_id] = {
                "total_executions": 0,
                "successful_executions": 0,
                "failed_executions": 0,
                "average_execution_time": 0.0,
                "average_governance_score": 0.0,
                "step_performance": {},
                "execution_history": []
            }
        
        analytics = self.workflow_analytics[workflow_id]
        
        # Update counters
        analytics["total_executions"] += 1
        if success:
            analytics["successful_executions"] += 1
        else:
            analytics["failed_executions"] += 1
        
        # Update average execution time
        total_time = analytics["average_execution_time"] * (analytics["total_executions"] - 1) + execution_time
        analytics["average_execution_time"] = total_time / analytics["total_executions"]
        
        # Update average governance score
        governance_score = governance_summary.get("overall_governance_score", 0.0)
        total_governance = analytics["average_governance_score"] * (analytics["total_executions"] - 1) + governance_score
        analytics["average_governance_score"] = total_governance / analytics["total_executions"]
        
        # Update workflow's execution count
        self.workflows[workflow_id]["execution_count"] = analytics["total_executions"]
        self.workflows[workflow_id]["last_executed"] = datetime.utcnow().isoformat()
        
        # Add to execution history (keep last 50 entries)
        analytics["execution_history"].append({
            "timestamp": datetime.utcnow().isoformat(),
            "success": success,
            "execution_time": execution_time,
            "governance_score": governance_score
        })
        if len(analytics["execution_history"]) > 50:
            analytics["execution_history"] = analytics["execution_history"][-50:]
    
    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a workflow.
        
        Args:
            workflow_id: ID of the workflow to get.
            
        Returns:
            Information about the workflow, or None if it doesn't exist.
        """
        return self.workflows.get(workflow_id)
    
    def get_workflow_execution(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a workflow execution.
        
        Args:
            execution_id: ID of the execution to get.
            
        Returns:
            Information about the execution, or None if it doesn't exist.
        """
        return self.workflow_executions.get(execution_id)
    
    def get_workflow_analytics(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow analytics.
        
        Args:
            workflow_id: ID of the workflow.
            
        Returns:
            Workflow analytics, or None if it doesn't exist.
        """
        return self.workflow_analytics.get(workflow_id)
    
    def list_workflows(self, workflow_type_filter: Optional[WorkflowType] = None,
                      status_filter: Optional[WorkflowStatus] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered workflows with optional filtering.
        
        Args:
            workflow_type_filter: Optional workflow type filter.
            status_filter: Optional status filter.
            
        Returns:
            Dictionary mapping workflow IDs to workflow information.
        """
        filtered_workflows = {}
        
        for workflow_id, workflow in self.workflows.items():
            # Apply workflow type filter
            if workflow_type_filter and workflow.get("workflow_type") != workflow_type_filter.value:
                continue
            
            # Apply status filter
            if status_filter and workflow.get("status") != status_filter.value:
                continue
            
            filtered_workflows[workflow_id] = workflow
        
        return filtered_workflows
    
    def get_active_workflows(self) -> List[str]:
        """Get list of currently active workflows.
        
        Returns:
            List of active workflow IDs.
        """
        active_workflows = []
        
        for workflow_id, workflow in self.workflows.items():
            if workflow.get("status") == WorkflowStatus.ACTIVE.value:
                active_workflows.append(workflow_id)
        
        return active_workflows
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_workflows": len(self.workflows),
            "workflows_by_type": {},
            "workflows_by_status": {},
            "total_executions": sum(analytics.get("total_executions", 0) for analytics in self.workflow_analytics.values()),
            "average_governance_scores": {}
        }
        
        # Count workflows by type
        for workflow in self.workflows.values():
            workflow_type = workflow.get("workflow_type", "unknown")
            stats["workflows_by_type"][workflow_type] = stats["workflows_by_type"].get(workflow_type, 0) + 1
        
        # Count workflows by status
        for workflow in self.workflows.values():
            status = workflow.get("status", "unknown")
            stats["workflows_by_status"][status] = stats["workflows_by_status"].get(status, 0) + 1
        
        # Calculate average governance scores
        if self.workflow_analytics:
            governance_scores = [analytics.get("average_governance_score", 0.0) for analytics in self.workflow_analytics.values()]
            stats["average_governance_scores"]["overall"] = sum(governance_scores) / len(governance_scores) if governance_scores else 0.0
        
        return stats
    
    def check_workflow_exists(self, workflow_id: str) -> bool:
        """Check if a workflow exists.
        
        Args:
            workflow_id: ID of the workflow to check.
            
        Returns:
            True if the workflow exists, False otherwise.
        """
        return workflow_id in self.workflows
    
    def update_workflow_status(self, workflow_id: str, status: WorkflowStatus) -> bool:
        """Update a workflow's status.
        
        Args:
            workflow_id: ID of the workflow to update.
            status: New status for the workflow.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if workflow_id not in self.workflows:
                logger.error(f"Workflow {workflow_id} does not exist")
                return False
            
            # Update workflow status
            self.workflows[workflow_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated workflow {workflow_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating workflow {workflow_id} status: {str(e)}")
            return False

