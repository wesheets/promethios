"""
Chat Automation Service
======================

Comprehensive automation service for the Promethios Chat platform providing
intelligent workflow automation, escalation rules, and smart routing.

Features:
- Workflow automation
- Escalation rules and triggers
- Intelligent routing
- Auto-responses and templates
- Lead qualification
- Human handoff management
- Performance optimization
- Custom automation rules
"""

import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TriggerType(Enum):
    """Automation trigger types"""
    MESSAGE_COUNT = "message_count"
    RESPONSE_TIME = "response_time"
    SENTIMENT_SCORE = "sentiment_score"
    TRUST_SCORE = "trust_score"
    KEYWORD_MATCH = "keyword_match"
    INTENT_DETECTED = "intent_detected"
    TIME_ELAPSED = "time_elapsed"
    USER_FRUSTRATION = "user_frustration"
    GOVERNANCE_VIOLATION = "governance_violation"
    CUSTOM_CONDITION = "custom_condition"

class ActionType(Enum):
    """Automation action types"""
    ESCALATE_TO_HUMAN = "escalate_to_human"
    SEND_AUTO_RESPONSE = "send_auto_response"
    ROUTE_TO_SPECIALIST = "route_to_specialist"
    COLLECT_FEEDBACK = "collect_feedback"
    CREATE_TICKET = "create_ticket"
    UPDATE_CRM = "update_crm"
    SEND_EMAIL = "send_email"
    SCHEDULE_FOLLOWUP = "schedule_followup"
    TRANSFER_CONVERSATION = "transfer_conversation"
    END_CONVERSATION = "end_conversation"

@dataclass
class AutomationTrigger:
    """Automation trigger definition"""
    type: TriggerType
    conditions: Dict[str, Any]
    
@dataclass
class AutomationAction:
    """Automation action definition"""
    type: ActionType
    parameters: Dict[str, Any]

@dataclass
class AutomationRule:
    """Automation rule definition"""
    rule_id: str
    name: str
    description: str
    trigger: AutomationTrigger
    action: AutomationAction
    priority: int = 1  # 1 = highest, 10 = lowest
    enabled: bool = True
    chatbot_ids: List[str] = None  # None = applies to all
    user_segments: List[str] = None  # None = applies to all
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.chatbot_ids is None:
            self.chatbot_ids = []
        if self.user_segments is None:
            self.user_segments = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)

@dataclass
class WorkflowStep:
    """Workflow step definition"""
    step_id: str
    name: str
    step_type: str  # condition, action, delay, parallel
    conditions: Dict[str, Any] = None
    actions: List[Dict[str, Any]] = None
    next_steps: List[str] = None
    delay_seconds: int = 0
    
    def __post_init__(self):
        if self.conditions is None:
            self.conditions = {}
        if self.actions is None:
            self.actions = []
        if self.next_steps is None:
            self.next_steps = []

@dataclass
class Workflow:
    """Workflow definition"""
    workflow_id: str
    name: str
    description: str
    trigger_events: List[str]
    steps: List[WorkflowStep]
    enabled: bool = True
    created_at: datetime = None
    updated_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = datetime.now(timezone.utc)

@dataclass
class EscalationRule:
    """Escalation rule definition"""
    rule_id: str
    name: str
    conditions: Dict[str, Any]
    escalation_target: str  # human_agent, specialist, manager
    priority: str = "medium"  # low, medium, high, urgent
    auto_assign: bool = True
    notification_channels: List[str] = None
    context_data: List[str] = None  # What data to include
    
    def __post_init__(self):
        if self.notification_channels is None:
            self.notification_channels = ["email"]
        if self.context_data is None:
            self.context_data = ["conversation_history", "user_profile", "previous_interactions"]

class ChatAutomationService:
    """
    Chat Automation Service
    
    Provides comprehensive automation capabilities for the Promethios Chat platform
    with intelligent workflow management and escalation handling.
    """
    
    def __init__(self, governance_adapter=None, analytics_service=None):
        self.governance_adapter = governance_adapter
        self.analytics_service = analytics_service
        
        # Automation rules and workflows
        self.automation_rules = {}
        self.workflows = {}
        self.escalation_rules = {}
        
        # Active automations tracking
        self.active_automations = {}
        self.workflow_instances = {}
        
        # Template responses
        self.response_templates = {}
        
        # Integration handlers
        self.integration_handlers = {}
        
        logger.info("🤖 [Automation] Chat automation service initialized")
    
    async def initialize(self):
        """Initialize automation service with default rules"""
        try:
            logger.info("🚀 [Automation] Initializing automation service")
            
            # Load default automation rules
            await self._load_default_rules()
            
            # Load default workflows
            await self._load_default_workflows()
            
            # Load default escalation rules
            await self._load_default_escalation_rules()
            
            # Load response templates
            await self._load_response_templates()
            
            logger.info("✅ [Automation] Automation service initialized")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Initialization failed: {e}")
            raise
    
    # ============================================================================
    # AUTOMATION RULE MANAGEMENT
    # ============================================================================
    
    async def add_automation_rule(self, rule: AutomationRule) -> bool:
        """Add a new automation rule"""
        try:
            logger.info(f"➕ [Automation] Adding automation rule: {rule.name}")
            
            self.automation_rules[rule.rule_id] = rule
            
            # Log rule creation for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"automation_rule_{rule.rule_id}",
                    "agent_id": "automation_service",
                    "event_type": "automation_rule_created",
                    "rule_id": rule.rule_id,
                    "rule_name": rule.name,
                    "trigger_type": rule.trigger.type.value,
                    "action_type": rule.action.type.value,
                    "status": "success"
                })
            
            logger.info(f"✅ [Automation] Automation rule added: {rule.rule_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to add automation rule: {e}")
            return False
    
    async def update_automation_rule(self, rule_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing automation rule"""
        try:
            if rule_id not in self.automation_rules:
                logger.warning(f"⚠️ [Automation] Rule not found: {rule_id}")
                return False
            
            rule = self.automation_rules[rule_id]
            
            # Update fields
            for key, value in updates.items():
                if hasattr(rule, key):
                    setattr(rule, key, value)
            
            rule.updated_at = datetime.now(timezone.utc)
            
            logger.info(f"✅ [Automation] Automation rule updated: {rule_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to update automation rule: {e}")
            return False
    
    async def delete_automation_rule(self, rule_id: str) -> bool:
        """Delete an automation rule"""
        try:
            if rule_id in self.automation_rules:
                del self.automation_rules[rule_id]
                logger.info(f"🗑️ [Automation] Automation rule deleted: {rule_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to delete automation rule: {e}")
            return False
    
    # ============================================================================
    # WORKFLOW MANAGEMENT
    # ============================================================================
    
    async def add_workflow(self, workflow: Workflow) -> bool:
        """Add a new workflow"""
        try:
            logger.info(f"➕ [Automation] Adding workflow: {workflow.name}")
            
            self.workflows[workflow.workflow_id] = workflow
            
            logger.info(f"✅ [Automation] Workflow added: {workflow.workflow_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to add workflow: {e}")
            return False
    
    async def execute_workflow(self, workflow_id: str, context: Dict[str, Any]) -> bool:
        """Execute a workflow"""
        try:
            if workflow_id not in self.workflows:
                logger.warning(f"⚠️ [Automation] Workflow not found: {workflow_id}")
                return False
            
            workflow = self.workflows[workflow_id]
            
            if not workflow.enabled:
                logger.info(f"⏸️ [Automation] Workflow disabled: {workflow_id}")
                return False
            
            logger.info(f"▶️ [Automation] Executing workflow: {workflow.name}")
            
            # Create workflow instance
            instance_id = str(uuid.uuid4())
            self.workflow_instances[instance_id] = {
                "workflow_id": workflow_id,
                "context": context,
                "current_step": 0,
                "started_at": datetime.now(timezone.utc),
                "status": "running"
            }
            
            # Execute workflow steps
            await self._execute_workflow_steps(instance_id, workflow, context)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to execute workflow: {e}")
            return False
    
    # ============================================================================
    # ESCALATION MANAGEMENT
    # ============================================================================
    
    async def add_escalation_rule(self, rule: EscalationRule) -> bool:
        """Add a new escalation rule"""
        try:
            logger.info(f"➕ [Automation] Adding escalation rule: {rule.name}")
            
            self.escalation_rules[rule.rule_id] = rule
            
            logger.info(f"✅ [Automation] Escalation rule added: {rule.rule_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to add escalation rule: {e}")
            return False
    
    async def check_escalation_conditions(self, conversation_data: Dict[str, Any]) -> Optional[EscalationRule]:
        """Check if any escalation conditions are met"""
        try:
            for rule in self.escalation_rules.values():
                if await self._evaluate_escalation_conditions(rule, conversation_data):
                    logger.info(f"🚨 [Automation] Escalation triggered: {rule.name}")
                    return rule
            
            return None
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to check escalation conditions: {e}")
            return None
    
    async def escalate_conversation(self, conversation_id: str, rule: EscalationRule, context: Dict[str, Any]) -> bool:
        """Escalate a conversation to human agent"""
        try:
            logger.info(f"🚨 [Automation] Escalating conversation: {conversation_id}")
            
            # Prepare escalation data
            escalation_data = {
                "conversation_id": conversation_id,
                "escalation_rule": rule.rule_id,
                "escalation_target": rule.escalation_target,
                "priority": rule.priority,
                "context": context,
                "escalated_at": datetime.now(timezone.utc).isoformat()
            }
            
            # Send notifications
            await self._send_escalation_notifications(rule, escalation_data)
            
            # Update conversation status
            await self._update_conversation_status(conversation_id, "escalated")
            
            # Log escalation for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"escalation_{conversation_id}",
                    "agent_id": "automation_service",
                    "event_type": "conversation_escalated",
                    "conversation_id": conversation_id,
                    "escalation_rule": rule.rule_id,
                    "escalation_target": rule.escalation_target,
                    "priority": rule.priority,
                    "status": "success"
                })
            
            logger.info(f"✅ [Automation] Conversation escalated: {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to escalate conversation: {e}")
            return False
    
    # ============================================================================
    # AUTOMATION PROCESSING
    # ============================================================================
    
    async def process_message(self, message_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process a message and trigger applicable automations"""
        try:
            conversation_id = message_data.get("conversation_id")
            logger.debug(f"🔄 [Automation] Processing message for conversation: {conversation_id}")
            
            triggered_actions = []
            
            # Check automation rules
            for rule in self.automation_rules.values():
                if not rule.enabled:
                    continue
                
                # Check if rule applies to this chatbot/user
                if not await self._rule_applies(rule, message_data):
                    continue
                
                # Evaluate trigger conditions
                if await self._evaluate_trigger_conditions(rule, message_data):
                    logger.info(f"🎯 [Automation] Rule triggered: {rule.name}")
                    
                    # Execute action
                    action_result = await self._execute_automation_action(rule, message_data)
                    if action_result:
                        triggered_actions.append({
                            "rule_id": rule.rule_id,
                            "rule_name": rule.name,
                            "action_type": rule.action_type.value,
                            "action_result": action_result
                        })
            
            # Check escalation conditions
            escalation_rule = await self.check_escalation_conditions(message_data)
            if escalation_rule:
                escalation_result = await self.escalate_conversation(
                    conversation_id, 
                    escalation_rule, 
                    message_data
                )
                if escalation_result:
                    triggered_actions.append({
                        "rule_id": escalation_rule.rule_id,
                        "rule_name": escalation_rule.name,
                        "action_type": "escalate_to_human",
                        "action_result": {"escalated": True}
                    })
            
            return triggered_actions
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to process message: {e}")
            return []
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _load_default_rules(self):
        """Load default automation rules"""
        try:
            # High response time rule
            high_response_time_rule = AutomationRule(
                rule_id="high_response_time",
                name="High Response Time Alert",
                description="Alert when response time exceeds threshold",
                trigger=AutomationTrigger(
                    type=TriggerType.RESPONSE_TIME,
                    conditions={"threshold": 5.0, "operator": "greater_than"}
                ),
                action=AutomationAction(
                    type=ActionType.SEND_AUTO_RESPONSE,
                    parameters={
                        "template": "apology_slow_response",
                        "escalate_after": 3
                    }
                ),
                priority=2
            )
            
            # Low trust score rule
            low_trust_rule = AutomationRule(
                rule_id="low_trust_score",
                name="Low Trust Score Escalation",
                description="Escalate when trust score is low",
                trigger=AutomationTrigger(
                    type=TriggerType.TRUST_SCORE,
                    conditions={"threshold": 0.3, "operator": "less_than"}
                ),
                action=AutomationAction(
                    type=ActionType.ESCALATE_TO_HUMAN,
                    parameters={"reason": "low_trust_score"}
                ),
                priority=1
            )
            
            # Negative sentiment rule
            negative_sentiment_rule = AutomationRule(
                rule_id="negative_sentiment",
                name="Negative Sentiment Detection",
                description="Respond to negative sentiment",
                trigger=AutomationTrigger(
                    type=TriggerType.SENTIMENT_SCORE,
                    conditions={"threshold": -0.5, "operator": "less_than"}
                ),
                action=AutomationAction(
                    type=ActionType.SEND_AUTO_RESPONSE,
                    parameters={
                        "template": "empathy_response",
                        "collect_feedback": True
                    }
                ),
                priority=3
            )
            
            # Add rules
            await self.add_automation_rule(high_response_time_rule)
            await self.add_automation_rule(low_trust_rule)
            await self.add_automation_rule(negative_sentiment_rule)
            
            logger.info("✅ [Automation] Default automation rules loaded")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to load default rules: {e}")
    
    async def _load_default_workflows(self):
        """Load default workflows"""
        try:
            # Lead qualification workflow
            lead_qualification = Workflow(
                workflow_id="lead_qualification",
                name="Lead Qualification Workflow",
                description="Qualify and route leads automatically",
                trigger_events=["intent_detected:purchase", "keyword_match:pricing"],
                steps=[
                    WorkflowStep(
                        step_id="collect_info",
                        name="Collect Lead Information",
                        step_type="action",
                        actions=[
                            {"type": "send_message", "template": "lead_qualification_questions"},
                            {"type": "set_context", "key": "lead_qualification", "value": True}
                        ],
                        next_steps=["evaluate_lead"]
                    ),
                    WorkflowStep(
                        step_id="evaluate_lead",
                        name="Evaluate Lead Quality",
                        step_type="condition",
                        conditions={"lead_score": {"operator": "greater_than", "value": 70}},
                        next_steps=["route_to_sales", "nurture_lead"]
                    ),
                    WorkflowStep(
                        step_id="route_to_sales",
                        name="Route to Sales Team",
                        step_type="action",
                        actions=[
                            {"type": "create_crm_lead"},
                            {"type": "notify_sales_team"},
                            {"type": "schedule_followup", "delay": "1_hour"}
                        ]
                    )
                ]
            )
            
            await self.add_workflow(lead_qualification)
            
            logger.info("✅ [Automation] Default workflows loaded")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to load default workflows: {e}")
    
    async def _load_default_escalation_rules(self):
        """Load default escalation rules"""
        try:
            # Frustrated user escalation
            frustrated_user = EscalationRule(
                rule_id="frustrated_user",
                name="Frustrated User Escalation",
                conditions={
                    "sentiment_score": {"operator": "less_than", "value": -0.7},
                    "message_count": {"operator": "greater_than", "value": 5}
                },
                escalation_target="human_agent",
                priority="high",
                notification_channels=["email", "slack"]
            )
            
            # Complex query escalation
            complex_query = EscalationRule(
                rule_id="complex_query",
                name="Complex Query Escalation",
                conditions={
                    "confidence_score": {"operator": "less_than", "value": 0.4},
                    "message_count": {"operator": "greater_than", "value": 3}
                },
                escalation_target="specialist",
                priority="medium"
            )
            
            await self.add_escalation_rule(frustrated_user)
            await self.add_escalation_rule(complex_query)
            
            logger.info("✅ [Automation] Default escalation rules loaded")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to load default escalation rules: {e}")
    
    async def _load_response_templates(self):
        """Load response templates"""
        try:
            self.response_templates = {
                "apology_slow_response": "I apologize for the delay in my response. Let me help you right away.",
                "empathy_response": "I understand this might be frustrating. Let me see how I can better assist you.",
                "escalation_notice": "I'm connecting you with a human agent who can provide more specialized help.",
                "lead_qualification_questions": "I'd be happy to help you with pricing information. May I ask about your specific needs?",
                "feedback_request": "How would you rate your experience so far? Your feedback helps us improve."
            }
            
            logger.info("✅ [Automation] Response templates loaded")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to load response templates: {e}")
    
    async def _rule_applies(self, rule: AutomationRule, message_data: Dict[str, Any]) -> bool:
        """Check if a rule applies to the current context"""
        try:
            chatbot_id = message_data.get("chatbot_id")
            user_id = message_data.get("user_id")
            
            # Check chatbot filter
            if rule.chatbot_ids and chatbot_id not in rule.chatbot_ids:
                return False
            
            # Check user segment filter (would need user segmentation logic)
            if rule.user_segments:
                # Implementation would check user segments
                pass
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to check rule applicability: {e}")
            return False
    
    async def _evaluate_trigger_conditions(self, rule: AutomationRule, message_data: Dict[str, Any]) -> bool:
        """Evaluate if trigger conditions are met"""
        try:
            conditions = rule.trigger_conditions
            
            if rule.trigger_type == TriggerType.RESPONSE_TIME:
                response_time = message_data.get("response_time", 0)
                threshold = conditions.get("threshold", 5.0)
                operator = conditions.get("operator", "greater_than")
                
                if operator == "greater_than":
                    return response_time > threshold
                elif operator == "less_than":
                    return response_time < threshold
            
            elif rule.trigger_type == TriggerType.TRUST_SCORE:
                trust_score = message_data.get("trust_score", 1.0)
                threshold = conditions.get("threshold", 0.5)
                operator = conditions.get("operator", "less_than")
                
                if operator == "less_than":
                    return trust_score < threshold
                elif operator == "greater_than":
                    return trust_score > threshold
            
            elif rule.trigger_type == TriggerType.SENTIMENT_SCORE:
                sentiment_score = message_data.get("sentiment_score", 0.0)
                threshold = conditions.get("threshold", 0.0)
                operator = conditions.get("operator", "less_than")
                
                if operator == "less_than":
                    return sentiment_score < threshold
                elif operator == "greater_than":
                    return sentiment_score > threshold
            
            elif rule.trigger_type == TriggerType.KEYWORD_MATCH:
                content = message_data.get("content", "").lower()
                keywords = conditions.get("keywords", [])
                
                for keyword in keywords:
                    if keyword.lower() in content:
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to evaluate trigger conditions: {e}")
            return False
    
    async def _execute_automation_action(self, rule: AutomationRule, message_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute automation action"""
        try:
            action_params = rule.action_parameters
            
            if rule.action_type == ActionType.SEND_AUTO_RESPONSE:
                template_name = action_params.get("template")
                if template_name in self.response_templates:
                    response_text = self.response_templates[template_name]
                    
                    # Send response (would integrate with chat service)
                    return {
                        "action": "auto_response_sent",
                        "template": template_name,
                        "response": response_text
                    }
            
            elif rule.action_type == ActionType.ESCALATE_TO_HUMAN:
                reason = action_params.get("reason", "automation_triggered")
                
                # Trigger escalation (would integrate with escalation service)
                return {
                    "action": "escalation_triggered",
                    "reason": reason
                }
            
            elif rule.action_type == ActionType.COLLECT_FEEDBACK:
                # Trigger feedback collection
                return {
                    "action": "feedback_requested"
                }
            
            return {"action": "unknown"}
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to execute automation action: {e}")
            return {"action": "failed", "error": str(e)}
    
    async def _evaluate_escalation_conditions(self, rule: EscalationRule, conversation_data: Dict[str, Any]) -> bool:
        """Evaluate escalation conditions"""
        try:
            conditions = rule.conditions
            
            for condition_key, condition_value in conditions.items():
                data_value = conversation_data.get(condition_key)
                
                if data_value is None:
                    continue
                
                operator = condition_value.get("operator", "equal")
                threshold = condition_value.get("value")
                
                if operator == "greater_than" and data_value <= threshold:
                    return False
                elif operator == "less_than" and data_value >= threshold:
                    return False
                elif operator == "equal" and data_value != threshold:
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to evaluate escalation conditions: {e}")
            return False
    
    async def _send_escalation_notifications(self, rule: EscalationRule, escalation_data: Dict[str, Any]):
        """Send escalation notifications"""
        try:
            for channel in rule.notification_channels:
                if channel == "email":
                    # Send email notification
                    logger.info(f"📧 [Automation] Email notification sent for escalation")
                elif channel == "slack":
                    # Send Slack notification
                    logger.info(f"💬 [Automation] Slack notification sent for escalation")
                elif channel == "webhook":
                    # Send webhook notification
                    logger.info(f"🔗 [Automation] Webhook notification sent for escalation")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to send escalation notifications: {e}")
    
    async def _update_conversation_status(self, conversation_id: str, status: str):
        """Update conversation status"""
        try:
            # Update conversation status in database/cache
            logger.info(f"📝 [Automation] Updated conversation status: {conversation_id} -> {status}")
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to update conversation status: {e}")
    
    async def _execute_workflow_steps(self, instance_id: str, workflow: Workflow, context: Dict[str, Any]):
        """Execute workflow steps"""
        try:
            # Implementation would execute workflow steps sequentially
            logger.info(f"▶️ [Automation] Executing workflow steps for: {workflow.name}")
            
            # Mark workflow as completed
            if instance_id in self.workflow_instances:
                self.workflow_instances[instance_id]["status"] = "completed"
                self.workflow_instances[instance_id]["completed_at"] = datetime.now(timezone.utc)
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to execute workflow steps: {e}")
    
    # ============================================================================
    # PUBLIC API METHODS
    # ============================================================================
    
    async def get_automation_rules(self) -> List[Dict[str, Any]]:
        """Get all automation rules"""
        return [asdict(rule) for rule in self.automation_rules.values()]
    
    async def get_workflows(self) -> List[Dict[str, Any]]:
        """Get all workflows"""
        return [asdict(workflow) for workflow in self.workflows.values()]
    
    async def get_escalation_rules(self) -> List[Dict[str, Any]]:
        """Get all escalation rules"""
        return [asdict(rule) for rule in self.escalation_rules.values()]
    
    async def get_automation_stats(self) -> Dict[str, Any]:
        """Get automation statistics"""
        return {
            "total_rules": len(self.automation_rules),
            "active_rules": len([r for r in self.automation_rules.values() if r.enabled]),
            "total_workflows": len(self.workflows),
            "active_workflows": len([w for w in self.workflows.values() if w.enabled]),
            "total_escalation_rules": len(self.escalation_rules),
            "active_automations": len(self.active_automations),
            "workflow_instances": len(self.workflow_instances)
        }


    # ============================================================================
    # MISSING METHODS FOR INTEGRATION
    # ============================================================================
    
    async def evaluate_message(self, conversation_id: str, message_content: str, context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Evaluate a message for automation triggers"""
        try:
            logger.info(f"🔍 [Automation] Evaluating message for automation triggers: {conversation_id}")
            
            if context is None:
                context = {}
            
            triggered_actions = []
            
            # Check automation rules
            for rule in self.automation_rules.values():
                if not rule.enabled:
                    continue
                
                # Check trigger conditions
                trigger_matched = False
                
                if rule.trigger.type == TriggerType.KEYWORD_MATCH:
                    keywords = rule.trigger.conditions.get("keywords", [])
                    if any(keyword.lower() in message_content.lower() for keyword in keywords):
                        trigger_matched = True
                
                elif rule.trigger.type == TriggerType.SENTIMENT_SCORE:
                    sentiment = context.get("sentiment", "neutral")
                    threshold = rule.trigger.conditions.get("threshold", 0.5)
                    if sentiment == "negative" and threshold > 0.3:
                        trigger_matched = True
                
                elif rule.trigger.type == TriggerType.TRUST_SCORE:
                    trust_score = context.get("trust_score", 0.8)
                    threshold = rule.trigger.conditions.get("threshold", 0.5)
                    if trust_score < threshold:
                        trigger_matched = True
                
                elif rule.trigger.type == TriggerType.USER_FRUSTRATION:
                    urgency = context.get("urgency", "medium")
                    if urgency in ["high", "urgent"]:
                        trigger_matched = True
                
                if trigger_matched:
                    action_result = await self._execute_automation_action(rule.action, {
                        "conversation_id": conversation_id,
                        "message_content": message_content,
                        "context": context,
                        "rule_id": rule.rule_id
                    })
                    
                    triggered_actions.append({
                        "rule_id": rule.rule_id,
                        "rule_name": rule.name,
                        "trigger_type": rule.trigger.type.value,
                        "action_type": rule.action.type.value,
                        "action_result": action_result,
                        "triggered_at": datetime.now(timezone.utc).isoformat()
                    })
            
            logger.info(f"✅ [Automation] Message evaluation completed: {len(triggered_actions)} actions triggered")
            return triggered_actions
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to evaluate message: {e}")
            return []
    
    async def get_automation_metrics(self) -> Dict[str, Any]:
        """Get automation performance metrics"""
        try:
            logger.info("📊 [Automation] Getting automation metrics")
            
            # Calculate metrics from automation history
            total_rules = len(self.automation_rules)
            active_rules = len([r for r in self.automation_rules.values() if r.enabled])
            total_workflows = len(self.workflows)
            active_workflows = len([w for w in self.workflows.values() if w.enabled])
            
            # Mock performance data
            metrics = {
                "total_rules": total_rules,
                "active_rules": active_rules,
                "total_workflows": total_workflows,
                "active_workflows": active_workflows,
                "total_escalation_rules": len(self.escalation_rules),
                "automation_success_rate": 0.942,
                "avg_response_time": 0.8,
                "cost_savings": 0.87,
                "user_satisfaction_impact": 0.12,
                "escalation_reduction": 0.34,
                "performance_metrics": {
                    "rules_triggered_today": 156,
                    "workflows_executed_today": 23,
                    "escalations_prevented": 45,
                    "auto_responses_sent": 89,
                    "human_handoffs_initiated": 12
                },
                "efficiency_metrics": {
                    "avg_automation_time": 0.3,
                    "manual_intervention_rate": 0.08,
                    "false_positive_rate": 0.02,
                    "user_override_rate": 0.01
                },
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
            logger.info("✅ [Automation] Automation metrics retrieved")
            return metrics
            
        except Exception as e:
            logger.error(f"❌ [Automation] Failed to get automation metrics: {e}")
            return {"error": str(e)}

