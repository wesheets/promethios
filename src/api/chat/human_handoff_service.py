"""
Human Handoff Service
====================

Comprehensive human handoff service for the Promethios Chat platform providing
seamless conversation transfers, agent management, and human-in-the-loop capabilities.

Features:
- Conversation handoff management
- Agent availability and routing
- Context preservation and transfer
- Workload balancing
- Performance tracking
- Queue management
- Real-time notifications
- Agent collaboration tools
"""

import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    """Agent availability status"""
    AVAILABLE = "available"
    BUSY = "busy"
    AWAY = "away"
    OFFLINE = "offline"

class ConversationStatus(Enum):
    """Conversation handoff status"""
    BOT_HANDLING = "bot_handling"
    PENDING_HANDOFF = "pending_handoff"
    AGENT_ASSIGNED = "agent_assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    ESCALATED = "escalated"

class HandoffReason(Enum):
    """Reason for handoff"""
    USER_REQUEST = "user_request"
    BOT_LIMITATION = "bot_limitation"
    COMPLEX_QUERY = "complex_query"
    ESCALATION = "escalation"
    NEGATIVE_SENTIMENT = "negative_sentiment"
    LOW_TRUST_SCORE = "low_trust_score"
    POLICY_VIOLATION = "policy_violation"
    TECHNICAL_ISSUE = "technical_issue"

@dataclass
class Agent:
    """Human agent definition"""
    agent_id: str
    name: str
    email: str
    specializations: List[str]
    status: AgentStatus
    current_conversations: List[str]
    max_conversations: int = 5
    skills: List[str] = None
    languages: List[str] = None
    shift_start: str = "09:00"
    shift_end: str = "17:00"
    timezone: str = "UTC"
    performance_rating: float = 0.0
    total_conversations: int = 0
    avg_resolution_time: float = 0.0
    satisfaction_score: float = 0.0
    created_at: datetime = None
    last_active: datetime = None
    
    def __post_init__(self):
        if self.skills is None:
            self.skills = []
        if self.languages is None:
            self.languages = ["en"]
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.last_active is None:
            self.last_active = datetime.now(timezone.utc)

@dataclass
class HandoffRequest:
    """Handoff request definition"""
    request_id: str
    conversation_id: str
    user_id: str
    chatbot_id: str
    reason: HandoffReason
    priority: str = "medium"  # low, medium, high, urgent
    requested_skills: List[str] = None
    context_summary: str = ""
    conversation_history: List[Dict] = None
    user_profile: Dict[str, Any] = None
    estimated_complexity: str = "medium"
    created_at: datetime = None
    assigned_agent: Optional[str] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    status: ConversationStatus = ConversationStatus.PENDING_HANDOFF
    
    def __post_init__(self):
        if self.requested_skills is None:
            self.requested_skills = []
        if self.conversation_history is None:
            self.conversation_history = []
        if self.user_profile is None:
            self.user_profile = {}
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

@dataclass
class ConversationTransfer:
    """Conversation transfer record"""
    transfer_id: str
    conversation_id: str
    from_agent: Optional[str]  # None if from bot
    to_agent: str
    reason: str
    context_data: Dict[str, Any]
    transfer_notes: str = ""
    created_at: datetime = None
    acknowledged_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

class HumanHandoffService:
    """
    Human Handoff Service
    
    Provides comprehensive human handoff capabilities for the Promethios Chat platform
    with intelligent agent routing and seamless conversation transfers.
    """
    
    def __init__(self, governance_adapter=None, analytics_service=None):
        self.governance_adapter = governance_adapter
        self.analytics_service = analytics_service
        
        # Agent management
        self.agents = {}
        self.agent_queues = {}  # skill-based queues
        
        # Handoff management
        self.handoff_requests = {}
        self.active_conversations = {}
        self.transfer_history = {}
        
        # Configuration
        self.auto_assignment = True
        self.queue_timeout = 300  # 5 minutes
        self.max_queue_size = 100
        
        # Performance tracking
        self.handoff_metrics = {
            "total_handoffs": 0,
            "avg_wait_time": 0.0,
            "avg_resolution_time": 0.0,
            "success_rate": 0.0
        }
        
        logger.info("👥 [Handoff] Human handoff service initialized")
    
    async def initialize(self):
        """Initialize handoff service with default agents and configuration"""
        try:
            logger.info("🚀 [Handoff] Initializing human handoff service")
            
            # Load default agents
            await self._load_default_agents()
            
            # Initialize skill-based queues
            await self._initialize_queues()
            
            # Start background tasks
            asyncio.create_task(self._queue_monitor())
            asyncio.create_task(self._agent_status_monitor())
            
            logger.info("✅ [Handoff] Human handoff service initialized")
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Initialization failed: {e}")
            raise
    
    # ============================================================================
    # AGENT MANAGEMENT
    # ============================================================================
    
    async def add_agent(self, agent: Agent) -> bool:
        """Add a new human agent"""
        try:
            logger.info(f"👤 [Handoff] Adding agent: {agent.name}")
            
            self.agents[agent.agent_id] = agent
            
            # Add to skill-based queues
            for skill in agent.specializations:
                if skill not in self.agent_queues:
                    self.agent_queues[skill] = []
                if agent.agent_id not in self.agent_queues[skill]:
                    self.agent_queues[skill].append(agent.agent_id)
            
            # Log agent addition for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"agent_added_{agent.agent_id}",
                    "agent_id": "handoff_service",
                    "event_type": "agent_added",
                    "agent_name": agent.name,
                    "specializations": agent.specializations,
                    "status": "success"
                })
            
            logger.info(f"✅ [Handoff] Agent added: {agent.agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to add agent: {e}")
            return False
    
    async def update_agent_status(self, agent_id: str, status: AgentStatus) -> bool:
        """Update agent availability status"""
        try:
            if agent_id not in self.agents:
                logger.warning(f"⚠️ [Handoff] Agent not found: {agent_id}")
                return False
            
            agent = self.agents[agent_id]
            old_status = agent.status
            agent.status = status
            agent.last_active = datetime.now(timezone.utc)
            
            logger.info(f"📊 [Handoff] Agent status updated: {agent.name} -> {status.value}")
            
            # If agent becomes available, check pending handoffs
            if status == AgentStatus.AVAILABLE and old_status != AgentStatus.AVAILABLE:
                await self._process_pending_handoffs()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to update agent status: {e}")
            return False
    
    async def get_available_agents(self, skills: List[str] = None) -> List[Agent]:
        """Get list of available agents, optionally filtered by skills"""
        try:
            available_agents = []
            
            for agent in self.agents.values():
                if agent.status != AgentStatus.AVAILABLE:
                    continue
                
                if len(agent.current_conversations) >= agent.max_conversations:
                    continue
                
                # Check if agent has required skills
                if skills:
                    if not any(skill in agent.specializations for skill in skills):
                        continue
                
                available_agents.append(agent)
            
            # Sort by workload and performance
            available_agents.sort(key=lambda a: (
                len(a.current_conversations),
                -a.performance_rating
            ))
            
            return available_agents
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to get available agents: {e}")
            return []
    
    # ============================================================================
    # HANDOFF MANAGEMENT
    # ============================================================================
    
    async def request_handoff(self, handoff_request: HandoffRequest) -> str:
        """Request a handoff to human agent"""
        try:
            logger.info(f"🔄 [Handoff] Handoff requested for conversation: {handoff_request.conversation_id}")
            
            # Store handoff request
            self.handoff_requests[handoff_request.request_id] = handoff_request
            
            # Update conversation status
            self.active_conversations[handoff_request.conversation_id] = {
                "status": ConversationStatus.PENDING_HANDOFF,
                "request_id": handoff_request.request_id,
                "created_at": handoff_request.created_at
            }
            
            # Try immediate assignment if auto-assignment is enabled
            if self.auto_assignment:
                assigned_agent = await self._auto_assign_agent(handoff_request)
                if assigned_agent:
                    await self._assign_conversation(handoff_request.request_id, assigned_agent.agent_id)
            
            # Log handoff request for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"handoff_requested_{handoff_request.request_id}",
                    "agent_id": "handoff_service",
                    "event_type": "handoff_requested",
                    "conversation_id": handoff_request.conversation_id,
                    "reason": handoff_request.reason.value,
                    "priority": handoff_request.priority,
                    "status": "success"
                })
            
            # Update metrics
            self.handoff_metrics["total_handoffs"] += 1
            
            logger.info(f"✅ [Handoff] Handoff request created: {handoff_request.request_id}")
            return handoff_request.request_id
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to request handoff: {e}")
            return ""
    
    async def assign_conversation(self, request_id: str, agent_id: str) -> bool:
        """Manually assign a conversation to a specific agent"""
        try:
            return await self._assign_conversation(request_id, agent_id)
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to assign conversation: {e}")
            return False
    
    async def transfer_conversation(self, conversation_id: str, from_agent: str, to_agent: str, reason: str, notes: str = "") -> bool:
        """Transfer conversation between agents"""
        try:
            logger.info(f"🔄 [Handoff] Transferring conversation: {conversation_id} from {from_agent} to {to_agent}")
            
            # Validate agents
            if from_agent not in self.agents or to_agent not in self.agents:
                logger.error("❌ [Handoff] Invalid agent IDs for transfer")
                return False
            
            # Check if target agent is available
            target_agent = self.agents[to_agent]
            if target_agent.status != AgentStatus.AVAILABLE:
                logger.error("❌ [Handoff] Target agent not available")
                return False
            
            if len(target_agent.current_conversations) >= target_agent.max_conversations:
                logger.error("❌ [Handoff] Target agent at capacity")
                return False
            
            # Create transfer record
            transfer = ConversationTransfer(
                transfer_id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                from_agent=from_agent,
                to_agent=to_agent,
                reason=reason,
                context_data=await self._get_conversation_context(conversation_id),
                transfer_notes=notes
            )
            
            # Update agent assignments
            source_agent = self.agents[from_agent]
            if conversation_id in source_agent.current_conversations:
                source_agent.current_conversations.remove(conversation_id)
            
            target_agent.current_conversations.append(conversation_id)
            
            # Store transfer record
            self.transfer_history[transfer.transfer_id] = transfer
            
            # Update conversation status
            if conversation_id in self.active_conversations:
                self.active_conversations[conversation_id]["assigned_agent"] = to_agent
                self.active_conversations[conversation_id]["transferred_at"] = datetime.now(timezone.utc)
            
            # Send notifications
            await self._send_transfer_notifications(transfer)
            
            # Log transfer for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"conversation_transferred_{transfer.transfer_id}",
                    "agent_id": "handoff_service",
                    "event_type": "conversation_transferred",
                    "conversation_id": conversation_id,
                    "from_agent": from_agent,
                    "to_agent": to_agent,
                    "reason": reason,
                    "status": "success"
                })
            
            logger.info(f"✅ [Handoff] Conversation transferred: {transfer.transfer_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to transfer conversation: {e}")
            return False
    
    async def resolve_conversation(self, conversation_id: str, agent_id: str, resolution_notes: str = "") -> bool:
        """Mark a conversation as resolved"""
        try:
            logger.info(f"✅ [Handoff] Resolving conversation: {conversation_id}")
            
            # Update agent workload
            if agent_id in self.agents:
                agent = self.agents[agent_id]
                if conversation_id in agent.current_conversations:
                    agent.current_conversations.remove(conversation_id)
                
                # Update agent performance metrics
                agent.total_conversations += 1
            
            # Update conversation status
            if conversation_id in self.active_conversations:
                self.active_conversations[conversation_id]["status"] = ConversationStatus.RESOLVED
                self.active_conversations[conversation_id]["resolved_at"] = datetime.now(timezone.utc)
                self.active_conversations[conversation_id]["resolution_notes"] = resolution_notes
            
            # Log resolution for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"conversation_resolved_{conversation_id}",
                    "agent_id": agent_id,
                    "event_type": "conversation_resolved",
                    "conversation_id": conversation_id,
                    "resolution_notes": resolution_notes,
                    "status": "success"
                })
            
            logger.info(f"✅ [Handoff] Conversation resolved: {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to resolve conversation: {e}")
            return False
    
    # ============================================================================
    # QUEUE MANAGEMENT
    # ============================================================================
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """Get current queue status and metrics"""
        try:
            pending_handoffs = [
                req for req in self.handoff_requests.values()
                if req.status == ConversationStatus.PENDING_HANDOFF
            ]
            
            # Group by priority
            priority_counts = {}
            for req in pending_handoffs:
                priority_counts[req.priority] = priority_counts.get(req.priority, 0) + 1
            
            # Calculate wait times
            wait_times = []
            for req in pending_handoffs:
                wait_time = (datetime.now(timezone.utc) - req.created_at).total_seconds()
                wait_times.append(wait_time)
            
            avg_wait_time = sum(wait_times) / len(wait_times) if wait_times else 0
            
            return {
                "total_pending": len(pending_handoffs),
                "priority_breakdown": priority_counts,
                "avg_wait_time": avg_wait_time,
                "longest_wait": max(wait_times) if wait_times else 0,
                "available_agents": len(await self.get_available_agents()),
                "total_agents": len([a for a in self.agents.values() if a.status != AgentStatus.OFFLINE])
            }
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to get queue status: {e}")
            return {}
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _load_default_agents(self):
        """Load default human agents"""
        try:
            default_agents = [
                Agent(
                    agent_id="agent_001",
                    name="Sarah Johnson",
                    email="sarah.johnson@company.com",
                    specializations=["customer_support", "technical_issues"],
                    status=AgentStatus.AVAILABLE,
                    current_conversations=[],
                    skills=["troubleshooting", "account_management"],
                    languages=["en", "es"],
                    performance_rating=4.5
                ),
                Agent(
                    agent_id="agent_002",
                    name="Mike Chen",
                    email="mike.chen@company.com",
                    specializations=["sales", "product_demo"],
                    status=AgentStatus.AVAILABLE,
                    current_conversations=[],
                    skills=["sales", "product_knowledge", "negotiation"],
                    languages=["en", "zh"],
                    performance_rating=4.3
                ),
                Agent(
                    agent_id="agent_003",
                    name="Emily Rodriguez",
                    email="emily.rodriguez@company.com",
                    specializations=["billing", "account_management"],
                    status=AgentStatus.AWAY,
                    current_conversations=[],
                    skills=["billing", "finance", "dispute_resolution"],
                    languages=["en", "es"],
                    performance_rating=4.7
                )
            ]
            
            for agent in default_agents:
                await self.add_agent(agent)
            
            logger.info("✅ [Handoff] Default agents loaded")
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to load default agents: {e}")
    
    async def _initialize_queues(self):
        """Initialize skill-based agent queues"""
        try:
            # Initialize queues for all specializations
            all_specializations = set()
            for agent in self.agents.values():
                all_specializations.update(agent.specializations)
            
            for specialization in all_specializations:
                if specialization not in self.agent_queues:
                    self.agent_queues[specialization] = []
            
            logger.info("✅ [Handoff] Agent queues initialized")
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to initialize queues: {e}")
    
    async def _auto_assign_agent(self, handoff_request: HandoffRequest) -> Optional[Agent]:
        """Automatically assign the best available agent"""
        try:
            # Get available agents with required skills
            available_agents = await self.get_available_agents(handoff_request.requested_skills)
            
            if not available_agents:
                logger.info("ℹ️ [Handoff] No available agents for auto-assignment")
                return None
            
            # Select best agent based on workload and skills match
            best_agent = available_agents[0]
            
            logger.info(f"🎯 [Handoff] Auto-assigned agent: {best_agent.name}")
            return best_agent
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to auto-assign agent: {e}")
            return None
    
    async def _assign_conversation(self, request_id: str, agent_id: str) -> bool:
        """Assign a conversation to an agent"""
        try:
            if request_id not in self.handoff_requests:
                logger.error(f"❌ [Handoff] Handoff request not found: {request_id}")
                return False
            
            if agent_id not in self.agents:
                logger.error(f"❌ [Handoff] Agent not found: {agent_id}")
                return False
            
            handoff_request = self.handoff_requests[request_id]
            agent = self.agents[agent_id]
            
            # Check agent availability
            if agent.status != AgentStatus.AVAILABLE:
                logger.error(f"❌ [Handoff] Agent not available: {agent.name}")
                return False
            
            if len(agent.current_conversations) >= agent.max_conversations:
                logger.error(f"❌ [Handoff] Agent at capacity: {agent.name}")
                return False
            
            # Assign conversation
            handoff_request.assigned_agent = agent_id
            handoff_request.assigned_at = datetime.now(timezone.utc)
            handoff_request.status = ConversationStatus.AGENT_ASSIGNED
            
            agent.current_conversations.append(handoff_request.conversation_id)
            
            # Update conversation status
            if handoff_request.conversation_id in self.active_conversations:
                self.active_conversations[handoff_request.conversation_id]["status"] = ConversationStatus.AGENT_ASSIGNED
                self.active_conversations[handoff_request.conversation_id]["assigned_agent"] = agent_id
                self.active_conversations[handoff_request.conversation_id]["assigned_at"] = datetime.now(timezone.utc)
            
            # Send notifications
            await self._send_assignment_notifications(handoff_request, agent)
            
            logger.info(f"✅ [Handoff] Conversation assigned: {handoff_request.conversation_id} -> {agent.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to assign conversation: {e}")
            return False
    
    async def _process_pending_handoffs(self):
        """Process pending handoff requests"""
        try:
            pending_requests = [
                req for req in self.handoff_requests.values()
                if req.status == ConversationStatus.PENDING_HANDOFF and req.assigned_agent is None
            ]
            
            for request in pending_requests:
                agent = await self._auto_assign_agent(request)
                if agent:
                    await self._assign_conversation(request.request_id, agent.agent_id)
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to process pending handoffs: {e}")
    
    async def _get_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """Get conversation context for transfer"""
        try:
            # In real implementation, this would fetch from conversation service
            return {
                "conversation_id": conversation_id,
                "summary": "Customer inquiry about billing issue",
                "key_points": ["billing dispute", "account access", "payment method"],
                "user_sentiment": "frustrated",
                "previous_interactions": 3
            }
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to get conversation context: {e}")
            return {}
    
    async def _send_assignment_notifications(self, handoff_request: HandoffRequest, agent: Agent):
        """Send notifications for conversation assignment"""
        try:
            # Send email notification to agent
            logger.info(f"📧 [Handoff] Assignment notification sent to: {agent.email}")
            
            # Send real-time notification (WebSocket, etc.)
            logger.info(f"🔔 [Handoff] Real-time notification sent to: {agent.name}")
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to send assignment notifications: {e}")
    
    async def _send_transfer_notifications(self, transfer: ConversationTransfer):
        """Send notifications for conversation transfer"""
        try:
            # Notify both agents
            logger.info(f"📧 [Handoff] Transfer notifications sent for: {transfer.transfer_id}")
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to send transfer notifications: {e}")
    
    async def _queue_monitor(self):
        """Background task to monitor queue and handle timeouts"""
        while True:
            try:
                await asyncio.sleep(60)  # Check every minute
                
                # Check for timed-out requests
                current_time = datetime.now(timezone.utc)
                for request in self.handoff_requests.values():
                    if (request.status == ConversationStatus.PENDING_HANDOFF and
                        (current_time - request.created_at).total_seconds() > self.queue_timeout):
                        
                        logger.warning(f"⏰ [Handoff] Request timed out: {request.request_id}")
                        # Handle timeout (escalate, notify, etc.)
                
            except Exception as e:
                logger.error(f"❌ [Handoff] Queue monitor error: {e}")
    
    async def _agent_status_monitor(self):
        """Background task to monitor agent status and activity"""
        while True:
            try:
                await asyncio.sleep(300)  # Check every 5 minutes
                
                current_time = datetime.now(timezone.utc)
                for agent in self.agents.values():
                    # Check for inactive agents
                    if (agent.status == AgentStatus.AVAILABLE and
                        (current_time - agent.last_active).total_seconds() > 1800):  # 30 minutes
                        
                        logger.info(f"😴 [Handoff] Agent inactive, setting to away: {agent.name}")
                        await self.update_agent_status(agent.agent_id, AgentStatus.AWAY)
                
            except Exception as e:
                logger.error(f"❌ [Handoff] Agent status monitor error: {e}")
    
    # ============================================================================
    # PUBLIC API METHODS
    # ============================================================================
    
    async def get_agents(self) -> List[Dict[str, Any]]:
        """Get all agents"""
        return [asdict(agent) for agent in self.agents.values()]
    
    async def get_handoff_requests(self, status: ConversationStatus = None) -> List[Dict[str, Any]]:
        """Get handoff requests, optionally filtered by status"""
        requests = self.handoff_requests.values()
        if status:
            requests = [req for req in requests if req.status == status]
        return [asdict(req) for req in requests]
    
    async def get_handoff_metrics(self) -> Dict[str, Any]:
        """Get handoff performance metrics"""
        return {
            **self.handoff_metrics,
            "queue_status": await self.get_queue_status(),
            "agent_utilization": await self._calculate_agent_utilization()
        }
    
    async def _calculate_agent_utilization(self) -> Dict[str, Any]:
        """Calculate agent utilization metrics"""
        try:
            total_agents = len(self.agents)
            available_agents = len([a for a in self.agents.values() if a.status == AgentStatus.AVAILABLE])
            busy_agents = len([a for a in self.agents.values() if a.status == AgentStatus.BUSY])
            
            total_capacity = sum(a.max_conversations for a in self.agents.values())
            current_load = sum(len(a.current_conversations) for a in self.agents.values())
            
            return {
                "total_agents": total_agents,
                "available_agents": available_agents,
                "busy_agents": busy_agents,
                "utilization_rate": (current_load / total_capacity * 100) if total_capacity > 0 else 0,
                "avg_conversations_per_agent": current_load / total_agents if total_agents > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to calculate agent utilization: {e}")
            return {}


    
    async def assign_conversation(self, handoff_id: str, agent_id: str) -> bool:
        """Assign a conversation to a specific agent"""
        try:
            logger.info(f"👤 [Handoff] Assigning conversation: {handoff_id} -> {agent_id}")
            
            # Check if handoff request exists
            if handoff_id not in self.handoff_requests:
                logger.warning(f"⚠️ [Handoff] Handoff request not found: {handoff_id}")
                return False
            
            # Check if agent exists and is available
            if agent_id not in self.agents:
                logger.warning(f"⚠️ [Handoff] Agent not found: {agent_id}")
                return False
            
            agent = self.agents[agent_id]
            handoff_request = self.handoff_requests[handoff_id]
            
            # Check agent availability
            if agent.status != AgentStatus.AVAILABLE:
                logger.warning(f"⚠️ [Handoff] Agent not available: {agent.name}")
                return False
            
            if len(agent.current_conversations) >= agent.max_conversations:
                logger.warning(f"⚠️ [Handoff] Agent at capacity: {agent.name}")
                return False
            
            # Assign conversation
            agent.current_conversations.append(handoff_request.conversation_id)
            handoff_request.assigned_agent = agent_id
            handoff_request.status = ConversationStatus.AGENT_ASSIGNED
            handoff_request.assigned_at = datetime.now(timezone.utc)
            
            # Update conversation status
            if handoff_request.conversation_id in self.active_conversations:
                self.active_conversations[handoff_request.conversation_id]["status"] = ConversationStatus.AGENT_ASSIGNED
                self.active_conversations[handoff_request.conversation_id]["assigned_agent_id"] = agent_id
                self.active_conversations[handoff_request.conversation_id]["assigned_at"] = datetime.now(timezone.utc)
            
            # Send notifications (simplified for testing)
            try:
                logger.info(f"📧 [Handoff] Assignment notification sent to: {agent.name}")
                logger.info(f"🔔 [Handoff] Real-time notification sent to: {agent.name}")
            except Exception as notification_error:
                logger.warning(f"⚠️ [Handoff] Notification failed: {notification_error}")
            
            # Log assignment for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"conversation_assigned_{handoff_request.conversation_id}",
                    "agent_id": agent_id,
                    "event_type": "conversation_assigned",
                    "conversation_id": handoff_request.conversation_id,
                    "handoff_id": handoff_id,
                    "assignment_time": datetime.now(timezone.utc).isoformat(),
                    "status": "success"
                })
            
            logger.info(f"✅ [Handoff] Conversation assigned: {handoff_request.conversation_id} -> {agent.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Handoff] Failed to assign conversation: {e}")
            return False

