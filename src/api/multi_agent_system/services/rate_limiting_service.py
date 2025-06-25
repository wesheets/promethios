"""
Real-time Rate Limiting Enforcement Service

Provides real-time rate limiting, throttling, and resource management for multi-agent systems.
Includes comprehensive monitoring and dashboard integration for governance oversight.
"""

from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel, Field, validator
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import time
import json
from collections import defaultdict, deque

class RateLimitType(str, Enum):
    REQUESTS_PER_SECOND = "requests_per_second"
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    TOKENS_PER_MINUTE = "tokens_per_minute"
    CONCURRENT_REQUESTS = "concurrent_requests"
    BANDWIDTH_MBPS = "bandwidth_mbps"
    CPU_PERCENTAGE = "cpu_percentage"
    MEMORY_MB = "memory_mb"

class ViolationSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ThrottleAction(str, Enum):
    WARN = "warn"
    DELAY = "delay"
    REJECT = "reject"
    QUEUE = "queue"
    REDIRECT = "redirect"

class RateLimitRule(BaseModel):
    rule_id: str = Field(..., description="Unique identifier for the rate limit rule")
    name: str = Field(..., description="Human-readable name for the rule")
    limit_type: RateLimitType = Field(..., description="Type of rate limiting")
    limit_value: float = Field(..., gt=0, description="Maximum allowed value")
    window_seconds: int = Field(..., gt=0, description="Time window in seconds")
    burst_allowance: float = Field(0.0, ge=0, description="Additional burst capacity")
    throttle_action: ThrottleAction = Field(ThrottleAction.DELAY, description="Action when limit exceeded")
    severity: ViolationSeverity = Field(ViolationSeverity.MEDIUM, description="Violation severity")
    enabled: bool = Field(True, description="Whether the rule is active")
    applies_to: List[str] = Field(default_factory=list, description="Agent IDs or context IDs this rule applies to")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional rule metadata")

class RateLimitViolation(BaseModel):
    violation_id: str
    rule_id: str
    agent_id: str
    context_id: Optional[str] = None
    violation_time: datetime
    limit_type: RateLimitType
    limit_value: float
    actual_value: float
    severity: ViolationSeverity
    action_taken: ThrottleAction
    duration_seconds: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class RateLimitStatus(BaseModel):
    agent_id: str
    context_id: Optional[str] = None
    current_usage: Dict[RateLimitType, float] = Field(default_factory=dict)
    limit_values: Dict[RateLimitType, float] = Field(default_factory=dict)
    utilization_percentage: Dict[RateLimitType, float] = Field(default_factory=dict)
    active_violations: List[RateLimitViolation] = Field(default_factory=list)
    throttle_status: Dict[str, Any] = Field(default_factory=dict)
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class SystemResourceMetrics(BaseModel):
    timestamp: datetime
    total_requests: int
    active_agents: int
    cpu_usage_percentage: float
    memory_usage_mb: float
    network_bandwidth_mbps: float
    queue_depth: int
    average_response_time_ms: float
    error_rate_percentage: float

class RateLimitingDashboardData(BaseModel):
    """Dashboard-specific data structure for governance UI"""
    overview: Dict[str, Any]
    active_violations: List[RateLimitViolation]
    agent_statuses: List[RateLimitStatus]
    system_metrics: SystemResourceMetrics
    rule_effectiveness: Dict[str, Any]
    trends: Dict[str, List[float]]
    alerts: List[Dict[str, Any]]

class RateLimitingService:
    """Service for real-time rate limiting, throttling, and resource management."""
    
    def __init__(self):
        self.rules: Dict[str, RateLimitRule] = {}
        self.agent_usage: Dict[str, Dict[RateLimitType, deque]] = defaultdict(lambda: defaultdict(deque))
        self.violations: List[RateLimitViolation] = []
        self.active_throttles: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.system_metrics_history: deque = deque(maxlen=1000)
        self.request_queues: Dict[str, deque] = defaultdict(deque)
        
        # Initialize default rules
        self._initialize_default_rules()
    
    def _initialize_default_rules(self):
        """Initialize default rate limiting rules for common scenarios."""
        
        default_rules = [
            RateLimitRule(
                rule_id="default_requests_per_minute",
                name="Default Requests Per Minute",
                limit_type=RateLimitType.REQUESTS_PER_MINUTE,
                limit_value=100.0,
                window_seconds=60,
                burst_allowance=20.0,
                throttle_action=ThrottleAction.DELAY,
                severity=ViolationSeverity.MEDIUM,
                applies_to=["*"]  # Apply to all agents
            ),
            RateLimitRule(
                rule_id="high_frequency_protection",
                name="High Frequency Protection",
                limit_type=RateLimitType.REQUESTS_PER_SECOND,
                limit_value=10.0,
                window_seconds=1,
                burst_allowance=5.0,
                throttle_action=ThrottleAction.REJECT,
                severity=ViolationSeverity.HIGH,
                applies_to=["*"]
            ),
            RateLimitRule(
                rule_id="concurrent_request_limit",
                name="Concurrent Request Limit",
                limit_type=RateLimitType.CONCURRENT_REQUESTS,
                limit_value=5.0,
                window_seconds=1,
                burst_allowance=2.0,
                throttle_action=ThrottleAction.QUEUE,
                severity=ViolationSeverity.MEDIUM,
                applies_to=["*"]
            ),
            RateLimitRule(
                rule_id="token_consumption_limit",
                name="Token Consumption Limit",
                limit_type=RateLimitType.TOKENS_PER_MINUTE,
                limit_value=10000.0,
                window_seconds=60,
                burst_allowance=2000.0,
                throttle_action=ThrottleAction.WARN,
                severity=ViolationSeverity.LOW,
                applies_to=["*"]
            ),
            RateLimitRule(
                rule_id="cpu_usage_protection",
                name="CPU Usage Protection",
                limit_type=RateLimitType.CPU_PERCENTAGE,
                limit_value=80.0,
                window_seconds=10,
                burst_allowance=10.0,
                throttle_action=ThrottleAction.DELAY,
                severity=ViolationSeverity.HIGH,
                applies_to=["*"]
            ),
            RateLimitRule(
                rule_id="memory_usage_protection",
                name="Memory Usage Protection",
                limit_type=RateLimitType.MEMORY_MB,
                limit_value=1024.0,
                window_seconds=5,
                burst_allowance=256.0,
                throttle_action=ThrottleAction.REJECT,
                severity=ViolationSeverity.CRITICAL,
                applies_to=["*"]
            )
        ]
        
        for rule in default_rules:
            self.rules[rule.rule_id] = rule
    
    async def check_rate_limit(
        self, 
        agent_id: str, 
        context_id: Optional[str] = None,
        request_type: str = "general",
        resource_usage: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """Check if a request should be allowed based on rate limiting rules."""
        
        current_time = datetime.utcnow()
        violations = []
        actions_taken = []
        
        # Get applicable rules for this agent/context
        applicable_rules = self._get_applicable_rules(agent_id, context_id)
        
        # Check each rule
        for rule in applicable_rules:
            if not rule.enabled:
                continue
            
            # Get current usage for this rule
            current_usage = await self._get_current_usage(agent_id, rule.limit_type, rule.window_seconds)
            
            # Add current request to usage
            if resource_usage and rule.limit_type.value in resource_usage:
                current_usage += resource_usage[rule.limit_type.value]
            else:
                current_usage += 1.0  # Default increment
            
            # Check if limit is exceeded
            effective_limit = rule.limit_value + rule.burst_allowance
            if current_usage > effective_limit:
                # Create violation record
                violation = RateLimitViolation(
                    violation_id=f"{agent_id}_{rule.rule_id}_{int(time.time())}",
                    rule_id=rule.rule_id,
                    agent_id=agent_id,
                    context_id=context_id,
                    violation_time=current_time,
                    limit_type=rule.limit_type,
                    limit_value=rule.limit_value,
                    actual_value=current_usage,
                    severity=rule.severity,
                    action_taken=rule.throttle_action
                )
                
                violations.append(violation)
                self.violations.append(violation)
                
                # Apply throttle action
                action_result = await self._apply_throttle_action(agent_id, rule, violation)
                actions_taken.append(action_result)
        
        # Record the request
        await self._record_request(agent_id, resource_usage or {})
        
        # Determine overall result
        should_allow = not any(action["block_request"] for action in actions_taken)
        delay_seconds = max((action.get("delay_seconds", 0) for action in actions_taken), default=0)
        
        return {
            "allowed": should_allow,
            "delay_seconds": delay_seconds,
            "violations": [v.dict() for v in violations],
            "actions_taken": actions_taken,
            "agent_id": agent_id,
            "context_id": context_id,
            "timestamp": current_time.isoformat()
        }
    
    async def _get_applicable_rules(self, agent_id: str, context_id: Optional[str] = None) -> List[RateLimitRule]:
        """Get rate limiting rules that apply to the given agent/context."""
        
        applicable_rules = []
        
        for rule in self.rules.values():
            # Check if rule applies to this agent/context
            if not rule.applies_to:
                continue
            
            applies = False
            for target in rule.applies_to:
                if target == "*":  # Universal rule
                    applies = True
                    break
                elif target == agent_id:  # Specific agent
                    applies = True
                    break
                elif context_id and target == context_id:  # Specific context
                    applies = True
                    break
                elif target.startswith("role:"):  # Role-based rule (would need role lookup)
                    # TODO: Implement role-based rule matching
                    pass
            
            if applies:
                applicable_rules.append(rule)
        
        return applicable_rules
    
    async def _get_current_usage(self, agent_id: str, limit_type: RateLimitType, window_seconds: int) -> float:
        """Get current usage for an agent within the specified time window."""
        
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        # Get usage history for this agent and limit type
        usage_history = self.agent_usage[agent_id][limit_type]
        
        # Remove old entries
        while usage_history and usage_history[0][0] < cutoff_time:
            usage_history.popleft()
        
        # Sum current usage
        if limit_type == RateLimitType.CONCURRENT_REQUESTS:
            # For concurrent requests, count active requests
            return len([entry for entry in usage_history if entry[1] == "active"])
        else:
            # For rate-based limits, sum the values
            return sum(entry[1] for entry in usage_history)
    
    async def _record_request(self, agent_id: str, resource_usage: Dict[str, float]):
        """Record a request and its resource usage."""
        
        current_time = time.time()
        
        # Record different types of usage
        usage_types = {
            RateLimitType.REQUESTS_PER_SECOND: 1.0,
            RateLimitType.REQUESTS_PER_MINUTE: 1.0,
            RateLimitType.REQUESTS_PER_HOUR: 1.0,
            RateLimitType.TOKENS_PER_MINUTE: resource_usage.get("tokens", 0),
            RateLimitType.CONCURRENT_REQUESTS: "active",
            RateLimitType.BANDWIDTH_MBPS: resource_usage.get("bandwidth_mb", 0),
            RateLimitType.CPU_PERCENTAGE: resource_usage.get("cpu_percent", 0),
            RateLimitType.MEMORY_MB: resource_usage.get("memory_mb", 0)
        }
        
        for limit_type, value in usage_types.items():
            if value > 0 or value == "active":
                self.agent_usage[agent_id][limit_type].append((current_time, value))
                
                # Limit history size
                if len(self.agent_usage[agent_id][limit_type]) > 10000:
                    self.agent_usage[agent_id][limit_type].popleft()
    
    async def _apply_throttle_action(
        self, 
        agent_id: str, 
        rule: RateLimitRule, 
        violation: RateLimitViolation
    ) -> Dict[str, Any]:
        """Apply the specified throttle action for a rate limit violation."""
        
        action_result = {
            "action": rule.throttle_action.value,
            "rule_id": rule.rule_id,
            "block_request": False,
            "delay_seconds": 0,
            "message": ""
        }
        
        if rule.throttle_action == ThrottleAction.WARN:
            action_result["message"] = f"Rate limit warning: {rule.name}"
            
        elif rule.throttle_action == ThrottleAction.DELAY:
            # Calculate delay based on violation severity
            delay_seconds = min(violation.actual_value / violation.limit_value * 2.0, 30.0)
            action_result["delay_seconds"] = delay_seconds
            action_result["message"] = f"Request delayed by {delay_seconds:.1f}s due to rate limiting"
            
        elif rule.throttle_action == ThrottleAction.REJECT:
            action_result["block_request"] = True
            action_result["message"] = f"Request rejected due to rate limit: {rule.name}"
            
        elif rule.throttle_action == ThrottleAction.QUEUE:
            # Add to queue (simplified implementation)
            self.request_queues[agent_id].append({
                "timestamp": time.time(),
                "rule_id": rule.rule_id,
                "violation": violation.dict()
            })
            action_result["message"] = f"Request queued due to rate limiting"
            
        elif rule.throttle_action == ThrottleAction.REDIRECT:
            action_result["message"] = f"Request should be redirected to alternative service"
        
        # Record throttle action
        self.active_throttles[agent_id][rule.rule_id] = {
            "action": rule.throttle_action.value,
            "start_time": time.time(),
            "violation": violation.dict()
        }
        
        return action_result
    
    async def get_agent_status(self, agent_id: str, context_id: Optional[str] = None) -> RateLimitStatus:
        """Get current rate limiting status for an agent."""
        
        current_usage = {}
        limit_values = {}
        utilization_percentage = {}
        
        # Get applicable rules
        applicable_rules = self._get_applicable_rules(agent_id, context_id)
        
        # Calculate current usage and utilization for each limit type
        for rule in applicable_rules:
            if not rule.enabled:
                continue
                
            current_value = await self._get_current_usage(agent_id, rule.limit_type, rule.window_seconds)
            current_usage[rule.limit_type] = current_value
            limit_values[rule.limit_type] = rule.limit_value
            
            if rule.limit_value > 0:
                utilization_percentage[rule.limit_type] = min((current_value / rule.limit_value) * 100, 100)
        
        # Get recent violations
        recent_violations = [
            v for v in self.violations 
            if v.agent_id == agent_id and 
            (datetime.utcnow() - v.violation_time).total_seconds() < 300  # Last 5 minutes
        ]
        
        # Get throttle status
        throttle_status = self.active_throttles.get(agent_id, {})
        
        return RateLimitStatus(
            agent_id=agent_id,
            context_id=context_id,
            current_usage=current_usage,
            limit_values=limit_values,
            utilization_percentage=utilization_percentage,
            active_violations=recent_violations,
            throttle_status=throttle_status,
            last_updated=datetime.utcnow()
        )
    
    async def get_system_metrics(self) -> SystemResourceMetrics:
        """Get current system-wide resource metrics."""
        
        current_time = datetime.utcnow()
        
        # Calculate metrics (mock implementation - would integrate with actual monitoring)
        total_requests = sum(len(usage_data[RateLimitType.REQUESTS_PER_MINUTE]) 
                           for usage_data in self.agent_usage.values())
        
        active_agents = len([agent_id for agent_id, usage_data in self.agent_usage.items() 
                           if any(len(type_usage) > 0 for type_usage in usage_data.values())])
        
        # Mock system metrics - would integrate with actual system monitoring
        metrics = SystemResourceMetrics(
            timestamp=current_time,
            total_requests=total_requests,
            active_agents=active_agents,
            cpu_usage_percentage=45.2,  # Mock value
            memory_usage_mb=2048.5,     # Mock value
            network_bandwidth_mbps=12.3, # Mock value
            queue_depth=sum(len(queue) for queue in self.request_queues.values()),
            average_response_time_ms=150.0,  # Mock value
            error_rate_percentage=2.1        # Mock value
        )
        
        # Store in history
        self.system_metrics_history.append(metrics)
        
        return metrics
    
    async def get_dashboard_data(self) -> RateLimitingDashboardData:
        """Get comprehensive data for the governance dashboard."""
        
        # Get current system metrics
        system_metrics = await self.get_system_metrics()
        
        # Get recent violations (last hour)
        recent_violations = [
            v for v in self.violations 
            if (datetime.utcnow() - v.violation_time).total_seconds() < 3600
        ]
        
        # Get status for all active agents
        active_agent_ids = list(self.agent_usage.keys())
        agent_statuses = []
        for agent_id in active_agent_ids:
            status = await self.get_agent_status(agent_id)
            agent_statuses.append(status)
        
        # Calculate overview statistics
        overview = {
            "total_active_agents": len(active_agent_ids),
            "total_violations_last_hour": len(recent_violations),
            "critical_violations": len([v for v in recent_violations if v.severity == ViolationSeverity.CRITICAL]),
            "average_cpu_usage": system_metrics.cpu_usage_percentage,
            "average_memory_usage": system_metrics.memory_usage_mb,
            "total_active_rules": len([r for r in self.rules.values() if r.enabled]),
            "agents_under_throttle": len([a for a in self.active_throttles.keys() if self.active_throttles[a]]),
            "queue_depth": system_metrics.queue_depth
        }
        
        # Calculate rule effectiveness
        rule_effectiveness = {}
        for rule_id, rule in self.rules.items():
            rule_violations = [v for v in recent_violations if v.rule_id == rule_id]
            rule_effectiveness[rule_id] = {
                "rule_name": rule.name,
                "violations_count": len(rule_violations),
                "effectiveness_score": max(0, 100 - len(rule_violations) * 5),  # Simple scoring
                "avg_violation_severity": self._calculate_avg_severity(rule_violations)
            }
        
        # Generate trends (last 24 data points)
        trends = {
            "cpu_usage": [m.cpu_usage_percentage for m in list(self.system_metrics_history)[-24:]],
            "memory_usage": [m.memory_usage_mb for m in list(self.system_metrics_history)[-24:]],
            "request_rate": [m.total_requests for m in list(self.system_metrics_history)[-24:]],
            "error_rate": [m.error_rate_percentage for m in list(self.system_metrics_history)[-24:]]
        }
        
        # Generate alerts
        alerts = []
        if system_metrics.cpu_usage_percentage > 80:
            alerts.append({
                "type": "warning",
                "message": f"High CPU usage: {system_metrics.cpu_usage_percentage:.1f}%",
                "timestamp": system_metrics.timestamp.isoformat()
            })
        
        if len(recent_violations) > 50:
            alerts.append({
                "type": "error",
                "message": f"High violation rate: {len(recent_violations)} violations in last hour",
                "timestamp": system_metrics.timestamp.isoformat()
            })
        
        critical_violations = [v for v in recent_violations if v.severity == ViolationSeverity.CRITICAL]
        if critical_violations:
            alerts.append({
                "type": "critical",
                "message": f"{len(critical_violations)} critical rate limit violations detected",
                "timestamp": system_metrics.timestamp.isoformat()
            })
        
        return RateLimitingDashboardData(
            overview=overview,
            active_violations=recent_violations,
            agent_statuses=agent_statuses,
            system_metrics=system_metrics,
            rule_effectiveness=rule_effectiveness,
            trends=trends,
            alerts=alerts
        )
    
    def _calculate_avg_severity(self, violations: List[RateLimitViolation]) -> float:
        """Calculate average severity score for violations."""
        if not violations:
            return 0.0
        
        severity_scores = {
            ViolationSeverity.LOW: 1,
            ViolationSeverity.MEDIUM: 2,
            ViolationSeverity.HIGH: 3,
            ViolationSeverity.CRITICAL: 4
        }
        
        total_score = sum(severity_scores.get(v.severity, 0) for v in violations)
        return total_score / len(violations)
    
    async def create_rule(self, rule: RateLimitRule) -> Dict[str, Any]:
        """Create a new rate limiting rule."""
        
        if rule.rule_id in self.rules:
            return {
                "success": False,
                "message": f"Rule with ID '{rule.rule_id}' already exists"
            }
        
        self.rules[rule.rule_id] = rule
        
        return {
            "success": True,
            "rule_id": rule.rule_id,
            "message": f"Rate limiting rule '{rule.name}' created successfully"
        }
    
    async def update_rule(self, rule_id: str, rule_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing rate limiting rule."""
        
        if rule_id not in self.rules:
            return {
                "success": False,
                "message": f"Rule with ID '{rule_id}' not found"
            }
        
        rule = self.rules[rule_id]
        
        # Update rule fields
        for field, value in rule_updates.items():
            if hasattr(rule, field):
                setattr(rule, field, value)
        
        return {
            "success": True,
            "rule_id": rule_id,
            "message": f"Rate limiting rule '{rule.name}' updated successfully"
        }
    
    async def delete_rule(self, rule_id: str) -> Dict[str, Any]:
        """Delete a rate limiting rule."""
        
        if rule_id not in self.rules:
            return {
                "success": False,
                "message": f"Rule with ID '{rule_id}' not found"
            }
        
        rule_name = self.rules[rule_id].name
        del self.rules[rule_id]
        
        return {
            "success": True,
            "rule_id": rule_id,
            "message": f"Rate limiting rule '{rule_name}' deleted successfully"
        }
    
    def get_all_rules(self) -> Dict[str, Any]:
        """Get all rate limiting rules."""
        
        return {
            "rules": {rule_id: rule.dict() for rule_id, rule in self.rules.items()},
            "total_rules": len(self.rules),
            "enabled_rules": len([r for r in self.rules.values() if r.enabled])
        }

# Global service instance
rate_limiting_service = RateLimitingService()

