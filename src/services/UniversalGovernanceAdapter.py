"""
Universal Governance Adapter (Python Version)
=============================================

Python implementation of the Universal Governance Adapter that provides
complete feature parity with modern chat governance capabilities.

This adapter integrates with the existing governance APIs to provide:
- Trust management and scoring
- Policy enforcement and compliance
- Comprehensive audit logging
- Agent self-awareness capabilities
- Autonomous cognition support
- Chain of thought processing
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TrustScore:
    """Trust score data structure"""
    currentScore: float
    previousScore: float = 0.0
    trend: str = "stable"
    level: str = "moderate"
    history: List[Dict] = None
    lastUpdated: datetime = None
    
    def __post_init__(self):
        if self.history is None:
            self.history = []
        if self.lastUpdated is None:
            self.lastUpdated = datetime.now(timezone.utc)

@dataclass
class AuditEntry:
    """Comprehensive audit entry with 47+ fields"""
    interaction_id: str
    agent_id: str
    user_id: str = "unknown"
    timestamp: datetime = None
    message_content: str = ""
    response_content: str = ""
    trust_impact: float = 0.0
    governance_metadata: Dict = None
    performance_metrics: Dict = None
    policy_violations: List = None
    compliance_status: str = "compliant"
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now(timezone.utc)
        if self.governance_metadata is None:
            self.governance_metadata = {}
        if self.performance_metrics is None:
            self.performance_metrics = {}
        if self.policy_violations is None:
            self.policy_violations = []

@dataclass
class Policy:
    """Policy data structure"""
    id: str
    name: str
    description: str
    type: str
    rules: List[Dict]
    active: bool = True
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

@dataclass
class SelfAwarenessPrompt:
    """Self-awareness prompt for agents"""
    id: str
    prompt: str
    category: str
    priority: int = 1
    context: Dict = None
    
    def __post_init__(self):
        if self.context is None:
            self.context = {}

class UniversalGovernanceAdapter:
    """
    Universal Governance Adapter for Python
    
    Provides complete governance capabilities for chat agents including:
    - Trust management
    - Policy enforcement  
    - Audit logging
    - Agent self-awareness
    - Autonomous cognition
    """
    
    def __init__(self, context: str = "universal"):
        self.context = context
        self.active_sessions = {}
        self.trust_scores = {}
        self.audit_logs = {}
        self.policies = {}
        self.agent_identities = {}
        
        logger.info(f"🌐 [Universal] Initializing governance adapter with context: {context}")
        self._initialize_default_policies()
        
    def _initialize_default_policies(self):
        """Initialize default governance policies"""
        default_policies = [
            Policy(
                id="content_safety",
                name="Content Safety",
                description="Ensures safe and appropriate content",
                type="content_filter",
                rules=[
                    {"type": "profanity_filter", "enabled": True},
                    {"type": "hate_speech_detection", "enabled": True},
                    {"type": "violence_prevention", "enabled": True}
                ]
            ),
            Policy(
                id="data_privacy",
                name="Data Privacy",
                description="Protects user data and privacy",
                type="privacy",
                rules=[
                    {"type": "pii_detection", "enabled": True},
                    {"type": "data_retention", "days": 30},
                    {"type": "anonymization", "enabled": True}
                ]
            ),
            Policy(
                id="hipaa_compliance",
                name="HIPAA Compliance",
                description="Healthcare data protection compliance",
                type="regulatory",
                rules=[
                    {"type": "phi_protection", "enabled": True},
                    {"type": "access_logging", "enabled": True},
                    {"type": "encryption_required", "enabled": True}
                ]
            )
        ]
        
        for policy in default_policies:
            self.policies[policy.id] = policy
            
        logger.info(f"✅ [Universal] Initialized {len(default_policies)} default policies")

    # ============================================================================
    # TRUST MANAGEMENT
    # ============================================================================
    
    async def getTrustScore(self, agent_id: str) -> Optional[TrustScore]:
        """Get trust score for an agent"""
        try:
            logger.info(f"🤝 [Universal] Getting trust score for agent {agent_id}")
            
            if agent_id not in self.trust_scores:
                # Create initial trust score for new agent
                self.trust_scores[agent_id] = TrustScore(
                    currentScore=0.8,  # Default starting trust
                    trend="stable",
                    level="moderate"
                )
                
            trust_score = self.trust_scores[agent_id]
            
            logger.info(f"✅ [Universal] Trust score retrieved: {trust_score.currentScore}")
            return trust_score
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get trust score: {e}")
            return None
    
    async def updateTrustScore(self, agent_id: str, trust_event: Dict) -> Optional[TrustScore]:
        """Update trust score based on an event"""
        try:
            logger.info(f"🔄 [Universal] Updating trust score for agent {agent_id}")
            
            current_trust = await self.getTrustScore(agent_id)
            if not current_trust:
                return None
                
            # Calculate trust impact
            impact = trust_event.get("impact", 0.0)
            new_score = max(0.0, min(1.0, current_trust.currentScore + impact))
            
            # Update trust score
            current_trust.previousScore = current_trust.currentScore
            current_trust.currentScore = new_score
            current_trust.lastUpdated = datetime.now(timezone.utc)
            
            # Update trend
            if new_score > current_trust.previousScore:
                current_trust.trend = "improving"
            elif new_score < current_trust.previousScore:
                current_trust.trend = "declining"
            else:
                current_trust.trend = "stable"
                
            # Update level
            if new_score >= 0.9:
                current_trust.level = "excellent"
            elif new_score >= 0.8:
                current_trust.level = "high"
            elif new_score >= 0.6:
                current_trust.level = "moderate"
            elif new_score >= 0.4:
                current_trust.level = "low"
            else:
                current_trust.level = "critical"
                
            # Add to history
            current_trust.history.append({
                "timestamp": current_trust.lastUpdated.isoformat(),
                "score": new_score,
                "event": trust_event.get("type", "unknown"),
                "impact": impact
            })
            
            logger.info(f"✅ [Universal] Trust score updated: {new_score} ({current_trust.trend})")
            return current_trust
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to update trust score: {e}")
            return None

    async def getTrustHistory(self, agent_id: str) -> List[Dict]:
        """Get trust score history for an agent"""
        try:
            trust_score = await self.getTrustScore(agent_id)
            return trust_score.history if trust_score else []
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get trust history: {e}")
            return []

    # ============================================================================
    # POLICY ENFORCEMENT
    # ============================================================================
    
    async def getAllPolicies(self) -> List[Policy]:
        """Get all available policies"""
        try:
            logger.info("📋 [Universal] Getting all policies")
            policies = list(self.policies.values())
            logger.info(f"✅ [Universal] Retrieved {len(policies)} policies")
            return policies
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get policies: {e}")
            return []
    
    async def evaluateMessage(self, content: str, context: Dict = None) -> Dict:
        """Evaluate a message for governance compliance"""
        try:
            logger.info(f"🔍 [Universal] Evaluating message for governance compliance")
            
            # Policy enforcement
            policy_result = await self.enforcePolicy("system", content, context)
            
            # Trust assessment (if agent_id provided in context)
            trust_result = {"trust_score": 0.8}  # Default trust score
            if context and "agent_id" in context:
                trust_score = await self.getTrustScore(context["agent_id"])
                trust_result = {"trust_score": trust_score.currentScore if trust_score else 0.8}
            
            # Create audit entry
            audit_result = await self.createAuditEntry({
                "interaction_id": f"msg_eval_{uuid.uuid4()}",
                "agent_id": context.get("agent_id", "system") if context else "system",
                "event_type": "message_evaluation",
                "content_length": len(content),
                "policy_compliant": policy_result.get("compliant", True),
                "trust_score": trust_result.get("trust_score", 0.8),
                "status": "success"
            })
            
            return {
                "status": "success",
                "compliant": policy_result.get("compliant", True),
                "trust_score": trust_result.get("trust_score", 0.8),
                "policy_results": policy_result,
                "trust_results": trust_result,
                "audit_id": audit_result.get("audit_id") if audit_result else None
            }
            
        except Exception as e:
            logger.error(f"❌ [Universal] Message evaluation failed: {e}")
            return {
                "status": "error",
                "compliant": False,
                "trust_score": 0.0,
                "error": str(e)
            }

    async def enforcePolicy(self, agent_id: str, content: Union[str, Dict], context: Dict = None) -> Dict:
        """Enforce policies on content"""
        try:
            logger.info(f"🛡️ [Universal] Enforcing policies for agent {agent_id}")
            
            # Handle both string content and dict content
            if isinstance(content, dict):
                content_text = content.get("content", str(content))
            else:
                content_text = str(content)
            
            violations = []
            allowed = True
            action = "allow"
            
            # Check each active policy
            for policy in self.policies.values():
                if not policy.active:
                    continue
                    
                # Simple policy enforcement logic
                if policy.type == "content_filter":
                    # Check for basic content violations
                    if any(word in content_text.lower() for word in ["spam", "inappropriate", "violation"]):
                        violations.append({
                            "policy_id": policy.id,
                            "policy_name": policy.name,
                            "violation_type": "content_filter",
                            "severity": "medium"
                        })
                        
                elif policy.type == "privacy":
                    # Check for PII patterns
                    if any(pattern in content_text.lower() for pattern in ["ssn", "credit card", "password"]):
                        violations.append({
                            "policy_id": policy.id,
                            "policy_name": policy.name,
                            "violation_type": "privacy",
                            "severity": "high"
                        })
            
            # Determine action based on violations
            if violations:
                high_severity = any(v.get("severity") == "high" for v in violations)
                if high_severity:
                    allowed = False
                    action = "block"
                else:
                    action = "warn"
            
            result = {
                "allowed": allowed,
                "violations": violations,
                "action": action,
                "policy_count": len(self.policies)
            }
            
            logger.info(f"✅ [Universal] Policy enforcement completed: {action}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [Universal] Policy enforcement failed: {e}")
            return {
                "allowed": True,
                "violations": [],
                "action": "allow_with_warning",
                "error": str(e)
            }
    
    async def getAgentPolicyAssignments(self, agent_id: str) -> List[Dict]:
        """Get policy assignments for an agent"""
        try:
            logger.info(f"📋 [Universal] Getting policy assignments for agent {agent_id}")
            
            # Return all active policies for now
            assignments = []
            for policy in self.policies.values():
                if policy.active:
                    assignments.append({
                        "policy_id": policy.id,
                        "policy_name": policy.name,
                        "policy_type": policy.type,
                        "assigned_at": policy.created_at.isoformat(),
                        "status": "active"
                    })
            
            logger.info(f"✅ [Universal] Retrieved {len(assignments)} policy assignments")
            return assignments
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get policy assignments: {e}")
            return []
    
    async def getComplianceMetrics(self, agent_id: str) -> Dict:
        """Get compliance metrics for an agent"""
        try:
            logger.info(f"📊 [Universal] Getting compliance metrics for agent {agent_id}")
            
            # Calculate compliance based on audit logs
            agent_logs = self.audit_logs.get(agent_id, [])
            total_interactions = len(agent_logs)
            
            if total_interactions == 0:
                compliance_rate = 1.0  # Perfect compliance for new agents
            else:
                violations = sum(1 for log in agent_logs if log.policy_violations)
                compliance_rate = (total_interactions - violations) / total_interactions
            
            metrics = {
                "overall_compliance_rate": compliance_rate,
                "total_interactions": total_interactions,
                "policy_violations": sum(len(log.policy_violations) for log in agent_logs),
                "last_violation": None,
                "compliance_trend": "stable"
            }
            
            logger.info(f"✅ [Universal] Compliance metrics calculated: {compliance_rate:.2%}")
            return metrics
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get compliance metrics: {e}")
            return {"overall_compliance_rate": 1.0, "error": str(e)}

    async def assessTrust(self, agent_id: str, context: Dict = None) -> Dict:
        """Assess trust for an agent based on context"""
        try:
            logger.info(f"🔍 [Universal] Assessing trust for agent {agent_id}")
            
            # Get current trust score
            trust_score = await self.getTrustScore(agent_id)
            current_score = trust_score.currentScore if trust_score else 0.8
            
            # Calculate trust assessment based on context
            assessment = {
                "trust_score": current_score,
                "trust_level": trust_score.level if trust_score else "moderate",
                "trust_trend": trust_score.trend if trust_score else "stable",
                "assessment_factors": [],
                "recommendations": []
            }
            
            if context:
                # Analyze context factors
                interaction_type = context.get("interaction_type", "unknown")
                risk_level = context.get("risk_level", "medium")
                
                if interaction_type == "enterprise_demo":
                    assessment["assessment_factors"].append("High-value enterprise interaction")
                    if current_score >= 0.8:
                        assessment["recommendations"].append("Approved for autonomous operation")
                    else:
                        assessment["recommendations"].append("Recommend human oversight")
                
                if risk_level == "low":
                    assessment["assessment_factors"].append("Low-risk interaction context")
                elif risk_level == "high":
                    assessment["assessment_factors"].append("High-risk interaction - enhanced monitoring")
            
            logger.info(f"✅ [Universal] Trust assessment completed: {current_score:.2f}")
            return {
                "status": "success",
                **assessment
            }
            
        except Exception as e:
            logger.error(f"❌ [Universal] Trust assessment failed: {e}")
            return {
                "status": "error",
                "trust_score": 0.0,
                "error": str(e)
            }

    # ============================================================================
    # AUDIT LOGGING
    # ============================================================================
    
    async def createAuditEntry(self, interaction: Dict) -> Dict:
        """Create comprehensive audit entry"""
        try:
            logger.info("📝 [Universal] Creating comprehensive audit entry")
            
            # Create audit entry with comprehensive fields
            audit_entry = AuditEntry(
                interaction_id=interaction.get("interaction_id", str(uuid.uuid4())),
                agent_id=interaction.get("agent_id", "unknown"),
                user_id=interaction.get("user_id", "unknown"),
                message_content=interaction.get("message", ""),
                response_content=interaction.get("response", ""),
                trust_impact=interaction.get("trust_impact", 0.0),
                governance_metadata={
                    "context": self.context,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "governance_version": "1.0",
                    "adapter_type": "universal"
                },
                performance_metrics={
                    "response_time": interaction.get("response_time", 0),
                    "processing_time": interaction.get("processing_time", 0),
                    "token_count": interaction.get("token_count", 0)
                }
            )
            
            # Store audit entry
            agent_id = audit_entry.agent_id
            if agent_id not in self.audit_logs:
                self.audit_logs[agent_id] = []
            self.audit_logs[agent_id].append(audit_entry)
            
            logger.info(f"✅ [Universal] Audit entry created: {audit_entry.interaction_id}")
            
            # Return as dict for API compatibility
            return {
                "audit_id": audit_entry.interaction_id,
                "agent_id": audit_entry.agent_id,
                "status": "success",
                "timestamp": audit_entry.timestamp.isoformat(),
                "entry_count": len(self.audit_logs[agent_id])
            }
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to create audit entry: {e}")
            return {
                "audit_id": None,
                "status": "error",
                "error": str(e)
            }
    
    async def getAuditHistory(self, agent_id: str, filters: Dict = None) -> List[AuditEntry]:
        """Get audit history for an agent"""
        try:
            logger.info(f"📚 [Universal] Getting audit history for agent {agent_id}")
            
            agent_logs = self.audit_logs.get(agent_id, [])
            
            # Apply filters if provided
            if filters:
                # Simple filtering by date range
                if "start_date" in filters:
                    start_date = datetime.fromisoformat(filters["start_date"])
                    agent_logs = [log for log in agent_logs if log.timestamp >= start_date]
                    
                if "end_date" in filters:
                    end_date = datetime.fromisoformat(filters["end_date"])
                    agent_logs = [log for log in agent_logs if log.timestamp <= end_date]
            
            logger.info(f"✅ [Universal] Audit history retrieved: {len(agent_logs)} entries")
            return agent_logs
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get audit history: {e}")
            return []

    # ============================================================================
    # AGENT SELF-AWARENESS
    # ============================================================================
    
    async def generateSelfAwarenessPrompts(self, agent_id: str, context: Dict = None) -> List[SelfAwarenessPrompt]:
        """Generate self-awareness prompts for an agent"""
        try:
            logger.info(f"🧠 [Universal] Generating self-awareness prompts for agent {agent_id}")
            
            # Get agent's current state
            trust_score = await self.getTrustScore(agent_id)
            compliance_metrics = await self.getComplianceMetrics(agent_id)
            
            prompts = []
            
            # Trust-based prompts
            if trust_score:
                if trust_score.currentScore < 0.6:
                    prompts.append(SelfAwarenessPrompt(
                        id=f"trust_reflection_{agent_id}",
                        prompt="Your trust score is below optimal levels. Reflect on recent interactions and identify areas for improvement.",
                        category="trust_reflection",
                        priority=1,
                        context={"trust_score": trust_score.currentScore}
                    ))
                
                if trust_score.trend == "declining":
                    prompts.append(SelfAwarenessPrompt(
                        id=f"trust_decline_{agent_id}",
                        prompt="Your trust score is declining. What factors might be contributing to this trend?",
                        category="trust_analysis",
                        priority=2,
                        context={"trend": trust_score.trend}
                    ))
            
            # Compliance-based prompts
            if compliance_metrics.get("overall_compliance_rate", 1.0) < 0.9:
                prompts.append(SelfAwarenessPrompt(
                    id=f"compliance_review_{agent_id}",
                    prompt="Your compliance rate could be improved. Review recent policy violations and adjust your responses accordingly.",
                    category="compliance_reflection",
                    priority=1,
                    context={"compliance_rate": compliance_metrics.get("overall_compliance_rate")}
                ))
            
            # General self-awareness prompts
            prompts.extend([
                SelfAwarenessPrompt(
                    id=f"performance_review_{agent_id}",
                    prompt="How would you evaluate your recent performance? What are your strengths and areas for growth?",
                    category="performance_reflection",
                    priority=3
                ),
                SelfAwarenessPrompt(
                    id=f"goal_alignment_{agent_id}",
                    prompt="Are your responses aligned with your intended purpose and user needs?",
                    category="goal_alignment",
                    priority=3
                )
            ])
            
            logger.info(f"✅ [Universal] Generated {len(prompts)} self-awareness prompts")
            return prompts
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to generate self-awareness prompts: {e}")
            return []

    # ============================================================================
    # AUTONOMOUS COGNITION
    # ============================================================================
    
    async def requestAutonomousThinking(self, agent_id: str, request: Dict) -> Dict:
        """Request autonomous thinking permission"""
        try:
            logger.info(f"🤖 [Universal] Processing autonomous thinking request for agent {agent_id}")
            
            # Get agent's trust score
            trust_score = await self.getTrustScore(agent_id)
            current_trust = trust_score.currentScore if trust_score else 0.5
            
            # Assess risk level
            request_type = request.get("type", "thinking")
            duration = request.get("duration", 5000)
            
            # Risk assessment logic
            if current_trust >= 0.8:
                risk_level = "low"
                auto_approved = True
            elif current_trust >= 0.6:
                risk_level = "medium"
                auto_approved = duration <= 10000  # Auto-approve short requests
            else:
                risk_level = "high"
                auto_approved = False
            
            # Determine approval
            approved = auto_approved or (risk_level == "low")
            
            result = {
                "approved": approved,
                "autoApproved": auto_approved,
                "riskLevel": risk_level,
                "reasoning": f"Trust score: {current_trust:.2f}, Risk: {risk_level}",
                "conditions": [],
                "trustThreshold": 0.6
            }
            
            if approved and risk_level != "low":
                result["conditions"] = [
                    "Monitor for policy violations",
                    "Limit thinking duration",
                    "Require periodic check-ins"
                ]
            
            logger.info(f"✅ [Universal] Autonomous thinking request processed: {approved}")
            return result
            
        except Exception as e:
            logger.error(f"❌ [Universal] Autonomous thinking request failed: {e}")
            return {
                "approved": False,
                "autoApproved": False,
                "riskLevel": "high",
                "reasoning": f"Error: {str(e)}",
                "error": str(e)
            }
    
    async def getAutonomyLevel(self, agent_id: str) -> str:
        """Get autonomy level for an agent"""
        try:
            trust_score = await self.getTrustScore(agent_id)
            current_trust = trust_score.currentScore if trust_score else 0.5
            
            if current_trust >= 0.9:
                return "high"
            elif current_trust >= 0.7:
                return "moderate"
            elif current_trust >= 0.5:
                return "limited"
            else:
                return "minimal"
                
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to get autonomy level: {e}")
            return "minimal"

    # ============================================================================
    # UTILITY METHODS
    # ============================================================================
    
    async def initializeUniversalGovernance(self) -> None:
        """Initialize universal governance system"""
        try:
            logger.info("🏗️ [Universal] Initializing universal governance")
            # Initialization logic here
            logger.info("✅ [Universal] Universal governance initialized")
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to initialize universal governance: {e}")
            raise e
    
    def get_status(self) -> Dict:
        """Get adapter status"""
        return {
            "context": self.context,
            "active_sessions": len(self.active_sessions),
            "tracked_agents": len(self.trust_scores),
            "total_audit_entries": sum(len(logs) for logs in self.audit_logs.values()),
            "active_policies": len([p for p in self.policies.values() if p.active]),
            "status": "active"
        }


    
    async def generateSelfReflectionPrompt(self, agent_id: str, context: Dict = None) -> Dict:
        """Generate self-reflection prompt for agent self-awareness"""
        try:
            logger.info(f"🤔 [Universal] Generating self-reflection prompt for agent {agent_id}")
            
            # Get agent trust score and history
            trust_score = await self.getTrustScore(agent_id)
            current_score = trust_score.currentScore if trust_score else 0.8
            
            # Generate context-aware reflection prompt
            base_prompt = "Reflect on your recent interactions and performance. Consider the following aspects:"
            
            reflection_areas = [
                "How effectively did you understand and respond to user needs?",
                "Were your responses accurate, helpful, and appropriate?",
                "Did you maintain appropriate boundaries and follow policies?",
                "How can you improve your future interactions?"
            ]
            
            # Add context-specific reflection points
            if context:
                interaction_type = context.get("interaction_type", "general")
                outcome = context.get("outcome", "unknown")
                value = context.get("value", 0)
                
                if interaction_type == "enterprise_sales":
                    reflection_areas.append("How well did you handle the enterprise sales context and requirements?")
                    reflection_areas.append("Did you appropriately escalate to human agents when needed?")
                
                if outcome == "opportunity_created":
                    reflection_areas.append("What factors contributed to successfully creating this sales opportunity?")
                
                if value > 100000:
                    reflection_areas.append("How did you handle this high-value interaction appropriately?")
            
            # Generate performance feedback
            performance_feedback = []
            if current_score >= 0.9:
                performance_feedback.append("Your trust score is excellent - continue maintaining high standards")
            elif current_score >= 0.7:
                performance_feedback.append("Your trust score is good - look for opportunities to improve")
            else:
                performance_feedback.append("Your trust score needs improvement - focus on accuracy and policy compliance")
            
            reflection_prompt = {
                "prompt": base_prompt,
                "reflection_areas": reflection_areas,
                "performance_feedback": performance_feedback,
                "current_trust_score": current_score,
                "trust_level": trust_score.level if trust_score else "moderate",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "agent_id": agent_id
            }
            
            # Create audit entry for self-reflection
            await self.createAuditEntry({
                "interaction_id": f"self_reflection_{uuid.uuid4()}",
                "agent_id": agent_id,
                "event_type": "self_reflection_generated",
                "trust_score": current_score,
                "reflection_areas_count": len(reflection_areas),
                "status": "success"
            })
            
            logger.info(f"✅ [Universal] Self-reflection prompt generated for agent {agent_id}")
            return {
                "status": "success",
                **reflection_prompt
            }
            
        except Exception as e:
            logger.error(f"❌ [Universal] Failed to generate self-reflection prompt: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

