"""
⚠️  DUPLICATE REGISTRY - DO NOT USE ⚠️

This Tool Registry is a DUPLICATE of existing functionality.
USE THE EXISTING SYSTEM INSTEAD:

EXISTING TOOL MANAGEMENT:
- Tool execution and management is handled by existing agent systems
- Tool coordination through multi-agent APIs
- Tool governance through existing Policy Enforcement Engine

EXISTING APIs TO USE:
- Multi-Agent System: /api/multi-agent/
- Agent Services: src/api/multi_agent_system/services/
- Existing tool management in agent coordination systems

This registry was built in error - the system already has tool management
integrated into the multi-agent coordination framework.

DO NOT EXTEND THIS CODE - USE EXISTING SYSTEM INSTEAD
""" usage across the multi-agent ecosystem.
"""

import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, NamedTuple, Callable
from enum import Enum

# Configure logging
logger = logging.getLogger(__name__)

class ToolType(Enum):
    """Tool type enumeration."""
    FUNCTION = "function"
    API = "api"
    SERVICE = "service"
    UTILITY = "utility"
    INTEGRATION = "integration"
    GOVERNANCE = "governance"

class ToolSecurityLevel(Enum):
    """Tool security level enumeration."""
    PUBLIC = "public"
    RESTRICTED = "restricted"
    PRIVATE = "private"
    GOVERNANCE_ONLY = "governance_only"

class ToolStatus(Enum):
    """Tool status enumeration."""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEPRECATED = "deprecated"
    MAINTENANCE = "maintenance"
    DISABLED = "disabled"

class ToolParameter(NamedTuple):
    """Tool parameter definition."""
    name: str
    type: str
    description: str
    required: bool
    default: Any = None
    validation_schema: Optional[Dict[str, Any]] = None

class ToolRegistrationResult(NamedTuple):
    """Result of tool registration."""
    success: bool
    tool_id: Optional[str] = None
    error: Optional[str] = None
    registration_timestamp: Optional[str] = None

class ToolInvocationResult(NamedTuple):
    """Result of tool invocation."""
    success: bool
    output: Any = None
    error: Optional[str] = None
    execution_time: float = 0.0
    governance_score: float = 0.0

class ToolRegistry:
    """Registry for managing tool lifecycle and coordination."""
    
    def __init__(
        self,
        schema_validator,
        seal_verification_service,
        registry_path: str,
        governance_integration=None,
        security_manager=None
    ):
        """Initialize the tool registry.
        
        Args:
            schema_validator: Validator for JSON schemas.
            seal_verification_service: Service for creating and verifying seals.
            registry_path: Path to the registry JSON file.
            governance_integration: Optional governance integration service.
            security_manager: Optional security manager for tool validation.
        """
        self.schema_validator = schema_validator
        self.seal_verification_service = seal_verification_service
        self.registry_path = registry_path
        self.governance_integration = governance_integration
        self.security_manager = security_manager
        self.tools = {}
        self.tool_implementations = {}
        self.tool_usage_stats = {}
        self.tool_governance_scores = {}
        
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
                    logger.error("Tool registry file seal verification failed")
                    raise ValueError("Tool registry file seal verification failed")
                
                # Load registry data
                self.tools = data.get("tools", {})
                self.tool_implementations = data.get("tool_implementations", {})
                self.tool_usage_stats = data.get("tool_usage_stats", {})
                self.tool_governance_scores = data.get("tool_governance_scores", {})
                
                logger.info(f"Loaded {len(self.tools)} tools from registry")
            except Exception as e:
                logger.error(f"Error loading tool registry: {str(e)}")
                self._initialize_empty_registry()
    
    def _initialize_empty_registry(self):
        """Initialize empty registry structures."""
        self.tools = {}
        self.tool_implementations = {}
        self.tool_usage_stats = {}
        self.tool_governance_scores = {}
    
    def _save_registry(self):
        """Save the registry to the JSON file."""
        # Create directory if it doesn't exist
        directory = os.path.dirname(self.registry_path)
        if directory and not os.path.exists(directory):
            os.makedirs(directory)
        
        # Prepare data for serialization (exclude non-serializable implementations)
        serializable_tools = {}
        for tool_id, tool in self.tools.items():
            serializable_tool = tool.copy()
            # Remove non-serializable function references
            if 'implementation' in serializable_tool:
                del serializable_tool['implementation']
            serializable_tools[tool_id] = serializable_tool
        
        # Prepare data for serialization
        data = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": "save_tool_registry",
            "tools": serializable_tools,
            "tool_usage_stats": self.tool_usage_stats,
            "tool_governance_scores": self.tool_governance_scores
        }
        
        # Create a seal
        data["seal"] = self.seal_verification_service.create_seal(data)
        
        # Save to file
        with open(self.registry_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"Saved {len(self.tools)} tools to registry")
    
    def _get_registry_state_hash(self) -> str:
        """Get a hash of the current registry state.
        
        Returns:
            Hash of the current registry state.
        """
        # Create a string representation of the registry state (excluding implementations)
        serializable_tools = {}
        for tool_id, tool in self.tools.items():
            serializable_tool = tool.copy()
            if 'implementation' in serializable_tool:
                del serializable_tool['implementation']
            serializable_tools[tool_id] = serializable_tool
        
        state_data = {
            "tools": serializable_tools,
            "tool_usage_stats": self.tool_usage_stats,
            "tool_governance_scores": self.tool_governance_scores
        }
        state_str = json.dumps(state_data, sort_keys=True)
        
        # Create a hash of the state
        return str(hash(state_str))
    
    def register_tool(self, tool_data: Dict[str, Any], implementation: Optional[Callable] = None) -> ToolRegistrationResult:
        """Register a new tool.
        
        Args:
            tool_data: Data for the tool to register.
                Must include tool_id, name, description, tool_type, parameters,
                security_level, and governance configuration.
            implementation: Optional callable implementation of the tool.
                
        Returns:
            ToolRegistrationResult with success status and details.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "register_tool",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return ToolRegistrationResult(
                    success=False,
                    error="Pre-loop tether verification failed"
                )
            
            # Validate the tool data
            validation_result = self.schema_validator.validate(tool_data, "tool_registration.schema.v1.json")
            if not validation_result.is_valid:
                logger.error(f"Tool validation failed: {validation_result.errors}")
                return ToolRegistrationResult(
                    success=False,
                    error=f"Tool validation failed: {validation_result.errors}"
                )
            
            # Check if the tool already exists
            tool_id = tool_data["tool_id"]
            if tool_id in self.tools:
                logger.error(f"Tool {tool_id} already exists")
                return ToolRegistrationResult(
                    success=False,
                    error=f"Tool {tool_id} already exists"
                )
            
            # Security validation if security manager is available
            if self.security_manager:
                security_result = self.security_manager.validate_tool(tool_data, implementation)
                if not security_result.is_valid:
                    logger.error(f"Tool security validation failed: {security_result.errors}")
                    return ToolRegistrationResult(
                        success=False,
                        error=f"Tool security validation failed: {security_result.errors}"
                    )
            
            # Prepare the tool data
            registration_timestamp = datetime.utcnow().isoformat()
            tool = {
                "tool_id": tool_id,
                "name": tool_data["name"],
                "description": tool_data["description"],
                "tool_type": tool_data["tool_type"],
                "version": tool_data.get("version", "1.0.0"),
                "author": tool_data.get("author", "unknown"),
                "parameters": tool_data.get("parameters", []),
                "security_level": tool_data.get("security_level", ToolSecurityLevel.PUBLIC.value),
                "governance_config": tool_data.get("governance_config", {}),
                "metadata": tool_data.get("metadata", {}),
                "registration_timestamp": registration_timestamp,
                "status": ToolStatus.AVAILABLE.value,
                "usage_count": 0,
                "last_used": None
            }
            
            # Add implementation if provided
            if implementation:
                tool["implementation"] = implementation
                self.tool_implementations[tool_id] = implementation
            
            # Create a seal for the tool
            tool_for_seal = tool.copy()
            if 'implementation' in tool_for_seal:
                del tool_for_seal['implementation']  # Don't include implementation in seal
            tool["seal"] = self.seal_verification_service.create_seal(tool_for_seal)
            
            # Add the tool to the registry
            self.tools[tool_id] = tool
            
            # Initialize tool usage stats
            self.tool_usage_stats[tool_id] = {
                "total_invocations": 0,
                "successful_invocations": 0,
                "failed_invocations": 0,
                "average_execution_time": 0.0,
                "last_invocation": None,
                "agents_using_tool": []
            }
            
            # Initialize governance scores if governance integration is available
            if self.governance_integration:
                governance_scores = self.governance_integration.initialize_tool_governance(tool_id, tool)
                self.tool_governance_scores[tool_id] = governance_scores
            else:
                self.tool_governance_scores[tool_id] = {
                    "security_score": 1.0,
                    "reliability_score": 1.0,
                    "governance_compliance": 1.0,
                    "risk_assessment": 0.0
                }
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Registered tool {tool_id}")
            return ToolRegistrationResult(
                success=True,
                tool_id=tool_id,
                registration_timestamp=registration_timestamp
            )
            
        except Exception as e:
            logger.error(f"Error registering tool: {str(e)}")
            return ToolRegistrationResult(
                success=False,
                error=f"Error registering tool: {str(e)}"
            )
    
    def unregister_tool(self, tool_id: str) -> bool:
        """Unregister a tool.
        
        Args:
            tool_id: ID of the tool to unregister.
            
        Returns:
            True if the tool was unregistered successfully.
        """
        try:
            # Pre-loop tether check
            registry_state_hash = self._get_registry_state_hash()
            tether_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": "unregister_tool",
                "registry_state_hash": registry_state_hash,
            }
            tether_data["seal"] = self.seal_verification_service.create_seal(tether_data)
            
            # Verify the tether
            if not self.seal_verification_service.verify_seal(tether_data):
                logger.error("Pre-loop tether verification failed")
                return False
            
            # Check if the tool exists
            if tool_id not in self.tools:
                logger.error(f"Tool {tool_id} does not exist")
                return False
            
            # Remove the tool and related data
            del self.tools[tool_id]
            if tool_id in self.tool_implementations:
                del self.tool_implementations[tool_id]
            if tool_id in self.tool_usage_stats:
                del self.tool_usage_stats[tool_id]
            if tool_id in self.tool_governance_scores:
                del self.tool_governance_scores[tool_id]
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Unregistered tool {tool_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error unregistering tool {tool_id}: {str(e)}")
            return False
    
    def invoke_tool(self, tool_id: str, parameters: Dict[str, Any], agent_id: Optional[str] = None) -> ToolInvocationResult:
        """Invoke a tool with the given parameters.
        
        Args:
            tool_id: ID of the tool to invoke.
            parameters: Parameters for the tool invocation.
            agent_id: Optional ID of the agent invoking the tool.
            
        Returns:
            ToolInvocationResult with success status and output.
        """
        start_time = datetime.utcnow()
        
        try:
            # Check if the tool exists
            if tool_id not in self.tools:
                return ToolInvocationResult(
                    success=False,
                    error=f"Tool {tool_id} does not exist"
                )
            
            tool = self.tools[tool_id]
            
            # Check if tool is available
            if tool.get("status") != ToolStatus.AVAILABLE.value:
                return ToolInvocationResult(
                    success=False,
                    error=f"Tool {tool_id} is not available (status: {tool.get('status')})"
                )
            
            # Validate parameters
            if self.schema_validator:
                param_schema = tool.get("parameter_schema")
                if param_schema:
                    validation_result = self.schema_validator.validate(parameters, param_schema)
                    if not validation_result.is_valid:
                        return ToolInvocationResult(
                            success=False,
                            error=f"Parameter validation failed: {validation_result.errors}"
                        )
            
            # Security check if security manager is available
            if self.security_manager:
                security_result = self.security_manager.authorize_tool_invocation(tool_id, agent_id, parameters)
                if not security_result.authorized:
                    return ToolInvocationResult(
                        success=False,
                        error=f"Tool invocation not authorized: {security_result.reason}"
                    )
            
            # Get tool implementation
            implementation = self.tool_implementations.get(tool_id)
            if not implementation:
                return ToolInvocationResult(
                    success=False,
                    error=f"Tool {tool_id} has no implementation"
                )
            
            # Invoke the tool
            try:
                output = implementation(**parameters)
                success = True
                error = None
            except Exception as e:
                output = None
                success = False
                error = f"Tool execution failed: {str(e)}"
            
            # Calculate execution time
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            # Update usage statistics
            self._update_tool_usage_stats(tool_id, success, execution_time, agent_id)
            
            # Calculate governance score if governance integration is available
            governance_score = 0.0
            if self.governance_integration:
                governance_score = self.governance_integration.evaluate_tool_invocation(
                    tool_id, parameters, output, success, agent_id
                )
            
            return ToolInvocationResult(
                success=success,
                output=output,
                error=error,
                execution_time=execution_time,
                governance_score=governance_score
            )
            
        except Exception as e:
            end_time = datetime.utcnow()
            execution_time = (end_time - start_time).total_seconds()
            
            logger.error(f"Error invoking tool {tool_id}: {str(e)}")
            return ToolInvocationResult(
                success=False,
                error=f"Error invoking tool: {str(e)}",
                execution_time=execution_time
            )
    
    def _update_tool_usage_stats(self, tool_id: str, success: bool, execution_time: float, agent_id: Optional[str]):
        """Update tool usage statistics.
        
        Args:
            tool_id: ID of the tool.
            success: Whether the invocation was successful.
            execution_time: Execution time in seconds.
            agent_id: Optional ID of the agent that invoked the tool.
        """
        if tool_id not in self.tool_usage_stats:
            self.tool_usage_stats[tool_id] = {
                "total_invocations": 0,
                "successful_invocations": 0,
                "failed_invocations": 0,
                "average_execution_time": 0.0,
                "last_invocation": None,
                "agents_using_tool": []
            }
        
        stats = self.tool_usage_stats[tool_id]
        
        # Update counters
        stats["total_invocations"] += 1
        if success:
            stats["successful_invocations"] += 1
        else:
            stats["failed_invocations"] += 1
        
        # Update average execution time
        total_time = stats["average_execution_time"] * (stats["total_invocations"] - 1) + execution_time
        stats["average_execution_time"] = total_time / stats["total_invocations"]
        
        # Update last invocation timestamp
        stats["last_invocation"] = datetime.utcnow().isoformat()
        
        # Track agent usage
        if agent_id and agent_id not in stats["agents_using_tool"]:
            stats["agents_using_tool"].append(agent_id)
        
        # Update tool's usage count and last used
        self.tools[tool_id]["usage_count"] = stats["total_invocations"]
        self.tools[tool_id]["last_used"] = stats["last_invocation"]
    
    def get_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a tool.
        
        Args:
            tool_id: ID of the tool to get.
            
        Returns:
            Information about the tool, or None if it doesn't exist.
        """
        tool = self.tools.get(tool_id)
        if tool:
            # Return a copy without the implementation
            tool_copy = tool.copy()
            if 'implementation' in tool_copy:
                del tool_copy['implementation']
            return tool_copy
        return None
    
    def get_tool_usage_stats(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """Get tool usage statistics.
        
        Args:
            tool_id: ID of the tool.
            
        Returns:
            Tool usage statistics, or None if it doesn't exist.
        """
        return self.tool_usage_stats.get(tool_id)
    
    def get_tool_governance_scores(self, tool_id: str) -> Optional[Dict[str, float]]:
        """Get tool governance scores.
        
        Args:
            tool_id: ID of the tool.
            
        Returns:
            Tool governance scores, or None if it doesn't exist.
        """
        return self.tool_governance_scores.get(tool_id)
    
    def list_tools(self, tool_type_filter: Optional[ToolType] = None,
                  security_level_filter: Optional[ToolSecurityLevel] = None,
                  status_filter: Optional[ToolStatus] = None) -> Dict[str, Dict[str, Any]]:
        """List all registered tools with optional filtering.
        
        Args:
            tool_type_filter: Optional tool type filter.
            security_level_filter: Optional security level filter.
            status_filter: Optional status filter.
            
        Returns:
            Dictionary mapping tool IDs to tool information.
        """
        filtered_tools = {}
        
        for tool_id, tool in self.tools.items():
            # Apply tool type filter
            if tool_type_filter and tool.get("tool_type") != tool_type_filter.value:
                continue
            
            # Apply security level filter
            if security_level_filter and tool.get("security_level") != security_level_filter.value:
                continue
            
            # Apply status filter
            if status_filter and tool.get("status") != status_filter.value:
                continue
            
            # Return copy without implementation
            tool_copy = tool.copy()
            if 'implementation' in tool_copy:
                del tool_copy['implementation']
            filtered_tools[tool_id] = tool_copy
        
        return filtered_tools
    
    def find_tools_by_capability(self, capability: str) -> List[str]:
        """Find tools that provide a specific capability.
        
        Args:
            capability: Capability to search for.
            
        Returns:
            List of tool IDs that provide the capability.
        """
        matching_tools = []
        
        for tool_id, tool in self.tools.items():
            capabilities = tool.get("capabilities", [])
            if capability in capabilities:
                matching_tools.append(tool_id)
        
        return matching_tools
    
    def get_available_tools(self) -> List[str]:
        """Get list of currently available tools.
        
        Returns:
            List of available tool IDs.
        """
        available_tools = []
        
        for tool_id, tool in self.tools.items():
            if tool.get("status") == ToolStatus.AVAILABLE.value:
                available_tools.append(tool_id)
        
        return available_tools
    
    def get_registry_statistics(self) -> Dict[str, Any]:
        """Get registry statistics.
        
        Returns:
            Dictionary containing registry statistics.
        """
        stats = {
            "total_tools": len(self.tools),
            "tools_by_type": {},
            "tools_by_security_level": {},
            "tools_by_status": {},
            "total_invocations": sum(stats.get("total_invocations", 0) for stats in self.tool_usage_stats.values()),
            "average_governance_scores": {}
        }
        
        # Count tools by type
        for tool in self.tools.values():
            tool_type = tool.get("tool_type", "unknown")
            stats["tools_by_type"][tool_type] = stats["tools_by_type"].get(tool_type, 0) + 1
        
        # Count tools by security level
        for tool in self.tools.values():
            security_level = tool.get("security_level", "unknown")
            stats["tools_by_security_level"][security_level] = stats["tools_by_security_level"].get(security_level, 0) + 1
        
        # Count tools by status
        for tool in self.tools.values():
            status = tool.get("status", "unknown")
            stats["tools_by_status"][status] = stats["tools_by_status"].get(status, 0) + 1
        
        # Calculate average governance scores
        if self.tool_governance_scores:
            governance_metrics = ["security_score", "reliability_score", "governance_compliance", "risk_assessment"]
            for metric in governance_metrics:
                scores = [scores.get(metric, 0.0) for scores in self.tool_governance_scores.values()]
                stats["average_governance_scores"][metric] = sum(scores) / len(scores) if scores else 0.0
        
        return stats
    
    def check_tool_exists(self, tool_id: str) -> bool:
        """Check if a tool exists.
        
        Args:
            tool_id: ID of the tool to check.
            
        Returns:
            True if the tool exists, False otherwise.
        """
        return tool_id in self.tools
    
    def update_tool_status(self, tool_id: str, status: ToolStatus) -> bool:
        """Update a tool's status.
        
        Args:
            tool_id: ID of the tool to update.
            status: New status for the tool.
            
        Returns:
            True if the status was updated successfully.
        """
        try:
            if tool_id not in self.tools:
                logger.error(f"Tool {tool_id} does not exist")
                return False
            
            # Update tool status
            self.tools[tool_id]["status"] = status.value
            
            # Save the updated registry
            self._save_registry()
            
            logger.info(f"Updated tool {tool_id} status to {status.value}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating tool {tool_id} status: {str(e)}")
            return False

