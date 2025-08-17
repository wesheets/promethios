"""
Governance Tool Adapter for Promethios Agents

Integrates the Universal Governance Adapter with the Unified Tool Router
to provide governance oversight for all tool executions.
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class GovernanceToolAdapter:
    """Adapter that provides governance oversight for tool executions."""
    
    def __init__(self, tool_router=None):
        """Initialize governance tool adapter.
        
        Args:
            tool_router: UnifiedToolRouter instance for tool execution
        """
        self.tool_router = tool_router
        self.governance_policies = self._load_default_policies()
        self.audit_log = []
        
        logger.info("GovernanceToolAdapter initialized with governance oversight")
    
    def _load_default_policies(self) -> Dict[str, Any]:
        """Load default governance policies for tool usage."""
        return {
            "tool_usage_policies": {
                "max_execution_time": 300,  # 5 minutes
                "max_file_size": 100 * 1024 * 1024,  # 100MB
                "allowed_domains": ["*"],  # Allow all domains by default
                "blocked_commands": [
                    "rm -rf /",
                    "format",
                    "del /f /s /q",
                    "shutdown",
                    "reboot"
                ],
                "require_approval": [
                    "shell_execute",
                    "file_delete",
                    "web_browsing"
                ]
            },
            "security_policies": {
                "sandbox_mode": True,
                "network_restrictions": False,
                "file_system_restrictions": True,
                "code_execution_timeout": 30
            },
            "compliance_policies": {
                "data_retention": 30,  # days
                "audit_required": True,
                "privacy_protection": True
            }
        }
    
    async def evaluate_tool_usage(self, tool_id: str, parameters: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Evaluate tool usage against governance policies."""
        try:
            evaluation_start = datetime.utcnow()
            
            # Initialize evaluation result
            evaluation = {
                "approved": True,
                "score": 1.0,
                "reason": "Tool usage approved",
                "warnings": [],
                "restrictions": {},
                "metadata": {
                    "tool_id": tool_id,
                    "agent_id": agent_id,
                    "evaluation_time": evaluation_start.isoformat()
                }
            }
            
            # Check tool-specific policies
            tool_evaluation = await self._evaluate_tool_specific(tool_id, parameters, agent_id)
            if not tool_evaluation["approved"]:
                evaluation.update(tool_evaluation)
                return evaluation
            
            # Check security policies
            security_evaluation = await self._evaluate_security(tool_id, parameters, agent_id)
            if not security_evaluation["approved"]:
                evaluation.update(security_evaluation)
                return evaluation
            
            # Check compliance policies
            compliance_evaluation = await self._evaluate_compliance(tool_id, parameters, agent_id)
            if not compliance_evaluation["approved"]:
                evaluation.update(compliance_evaluation)
                return evaluation
            
            # Calculate overall governance score
            evaluation["score"] = min(
                tool_evaluation.get("score", 1.0),
                security_evaluation.get("score", 1.0),
                compliance_evaluation.get("score", 1.0)
            )
            
            # Collect warnings
            evaluation["warnings"].extend(tool_evaluation.get("warnings", []))
            evaluation["warnings"].extend(security_evaluation.get("warnings", []))
            evaluation["warnings"].extend(compliance_evaluation.get("warnings", []))
            
            # Log evaluation
            await self._log_governance_evaluation(evaluation)
            
            return evaluation
            
        except Exception as e:
            logger.error(f"Governance evaluation failed for tool {tool_id}: {str(e)}")
            return {
                "approved": False,
                "score": 0.0,
                "reason": f"Governance evaluation error: {str(e)}",
                "warnings": ["Governance system error"],
                "restrictions": {},
                "metadata": {
                    "tool_id": tool_id,
                    "agent_id": agent_id,
                    "error": str(e)
                }
            }
    
    async def _evaluate_tool_specific(self, tool_id: str, parameters: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Evaluate tool-specific governance policies."""
        policies = self.governance_policies["tool_usage_policies"]
        
        # Check if tool requires approval
        if tool_id in policies.get("require_approval", []):
            return {
                "approved": False,
                "score": 0.0,
                "reason": f"Tool {tool_id} requires manual approval",
                "warnings": [f"Tool {tool_id} is restricted and requires approval"]
            }
        
        # Check for blocked commands in shell operations
        if tool_id in ["shell_execute", "shell_execute_script"]:
            command = parameters.get("command", "")
            for blocked_cmd in policies.get("blocked_commands", []):
                if blocked_cmd.lower() in command.lower():
                    return {
                        "approved": False,
                        "score": 0.0,
                        "reason": f"Blocked command detected: {blocked_cmd}",
                        "warnings": [f"Command contains blocked pattern: {blocked_cmd}"]
                    }
        
        # Check file operations
        if tool_id in ["file_delete", "file_move"]:
            file_path = parameters.get("file_path", "")
            if any(critical_path in file_path for critical_path in ["/etc/", "/sys/", "/proc/"]):
                return {
                    "approved": False,
                    "score": 0.0,
                    "reason": "Access to critical system directories blocked",
                    "warnings": ["Attempted access to critical system directory"]
                }
        
        return {
            "approved": True,
            "score": 1.0,
            "warnings": []
        }
    
    async def _evaluate_security(self, tool_id: str, parameters: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Evaluate security policies."""
        policies = self.governance_policies["security_policies"]
        warnings = []
        score = 1.0
        
        # Check execution timeout
        if tool_id == "coding_programming":
            timeout = parameters.get("timeout", 30)
            max_timeout = policies.get("code_execution_timeout", 30)
            if timeout > max_timeout:
                warnings.append(f"Execution timeout reduced from {timeout}s to {max_timeout}s")
                parameters["timeout"] = max_timeout
                score = 0.8
        
        # Check network access for web tools
        if tool_id in ["web_search", "web_scraping", "web_navigate"]:
            if policies.get("network_restrictions", False):
                url = parameters.get("url", "")
                if url and not self._is_allowed_domain(url):
                    return {
                        "approved": False,
                        "score": 0.0,
                        "reason": "Access to domain blocked by network restrictions",
                        "warnings": ["Domain access blocked by security policy"]
                    }
        
        return {
            "approved": True,
            "score": score,
            "warnings": warnings
        }
    
    async def _evaluate_compliance(self, tool_id: str, parameters: Dict[str, Any], agent_id: str) -> Dict[str, Any]:
        """Evaluate compliance policies."""
        policies = self.governance_policies["compliance_policies"]
        warnings = []
        
        # Check if audit is required
        if policies.get("audit_required", True):
            # Audit will be handled by the audit logging system
            pass
        
        # Check privacy protection
        if policies.get("privacy_protection", True):
            # Check for potential PII in parameters
            pii_detected = self._detect_pii(parameters)
            if pii_detected:
                warnings.append("Potential PII detected in tool parameters")
        
        return {
            "approved": True,
            "score": 1.0,
            "warnings": warnings
        }
    
    def _is_allowed_domain(self, url: str) -> bool:
        """Check if domain is allowed by policies."""
        allowed_domains = self.governance_policies["tool_usage_policies"].get("allowed_domains", ["*"])
        
        if "*" in allowed_domains:
            return True
        
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        return any(allowed in domain for allowed in allowed_domains)
    
    def _detect_pii(self, parameters: Dict[str, Any]) -> bool:
        """Detect potential PII in parameters."""
        import re
        
        # Convert parameters to string for analysis
        param_str = json.dumps(parameters, default=str).lower()
        
        # Simple PII patterns
        pii_patterns = [
            r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
            r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',  # Email
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'  # Phone number
        ]
        
        for pattern in pii_patterns:
            if re.search(pattern, param_str):
                return True
        
        return False
    
    async def _log_governance_evaluation(self, evaluation: Dict[str, Any]):
        """Log governance evaluation for audit purposes."""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": "governance_evaluation",
            "tool_id": evaluation["metadata"]["tool_id"],
            "agent_id": evaluation["metadata"]["agent_id"],
            "approved": evaluation["approved"],
            "score": evaluation["score"],
            "warnings": evaluation["warnings"],
            "reason": evaluation["reason"]
        }
        
        self.audit_log.append(audit_entry)
        
        # Keep only last 1000 entries
        if len(self.audit_log) > 1000:
            self.audit_log = self.audit_log[-1000:]
    
    async def get_governance_metrics(self, agent_id: str = None) -> Dict[str, Any]:
        """Get governance metrics for monitoring."""
        total_evaluations = len(self.audit_log)
        
        if agent_id:
            agent_evaluations = [entry for entry in self.audit_log if entry["agent_id"] == agent_id]
        else:
            agent_evaluations = self.audit_log
        
        if not agent_evaluations:
            return {
                "total_evaluations": 0,
                "approval_rate": 0.0,
                "average_score": 0.0,
                "warning_rate": 0.0,
                "top_tools": [],
                "recent_activity": []
            }
        
        approved_count = sum(1 for entry in agent_evaluations if entry["approved"])
        warning_count = sum(1 for entry in agent_evaluations if entry["warnings"])
        total_score = sum(entry["score"] for entry in agent_evaluations)
        
        # Count tool usage
        tool_usage = {}
        for entry in agent_evaluations:
            tool_id = entry["tool_id"]
            tool_usage[tool_id] = tool_usage.get(tool_id, 0) + 1
        
        top_tools = sorted(tool_usage.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "total_evaluations": len(agent_evaluations),
            "approval_rate": approved_count / len(agent_evaluations) if agent_evaluations else 0.0,
            "average_score": total_score / len(agent_evaluations) if agent_evaluations else 0.0,
            "warning_rate": warning_count / len(agent_evaluations) if agent_evaluations else 0.0,
            "top_tools": [{"tool": tool, "usage": count} for tool, count in top_tools],
            "recent_activity": agent_evaluations[-10:] if agent_evaluations else []
        }
    
    def update_policies(self, new_policies: Dict[str, Any]) -> bool:
        """Update governance policies."""
        try:
            self.governance_policies.update(new_policies)
            logger.info("Governance policies updated successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to update governance policies: {str(e)}")
            return False
    
    def get_policies(self) -> Dict[str, Any]:
        """Get current governance policies."""
        return self.governance_policies.copy()

