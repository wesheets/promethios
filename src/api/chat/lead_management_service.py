"""
Lead Management Service
======================

Comprehensive lead management service for the Promethios Chat platform providing
intelligent lead qualification, scoring, and sales pipeline integration.

Features:
- Lead capture and qualification
- Intelligent lead scoring
- Sales pipeline integration
- Lead nurturing workflows
- Performance tracking
- CRM synchronization
- Follow-up automation
- Conversion analytics
"""

import asyncio
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LeadStatus(Enum):
    """Lead status in the pipeline"""
    NEW = "new"
    QUALIFIED = "qualified"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"
    NURTURING = "nurturing"

class LeadSource(Enum):
    """Lead source channels"""
    CHAT = "chat"
    WEBSITE = "website"
    EMAIL = "email"
    SOCIAL = "social"
    REFERRAL = "referral"
    ADVERTISING = "advertising"
    EVENT = "event"
    COLD_OUTREACH = "cold_outreach"

class LeadPriority(Enum):
    """Lead priority levels"""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"

@dataclass
class Lead:
    """Lead definition"""
    lead_id: str
    conversation_id: str
    user_id: str
    chatbot_id: str
    
    # Contact information
    name: str = ""
    email: str = ""
    phone: str = ""
    company: str = ""
    job_title: str = ""
    
    # Lead details
    status: LeadStatus = LeadStatus.NEW
    source: LeadSource = LeadSource.CHAT
    priority: LeadPriority = LeadPriority.COLD
    score: float = 0.0
    
    # Qualification data
    budget: Optional[float] = None
    timeline: str = ""
    decision_maker: bool = False
    pain_points: List[str] = None
    interests: List[str] = None
    requirements: Dict[str, Any] = None
    
    # Tracking
    created_at: datetime = None
    last_contact: Optional[datetime] = None
    next_followup: Optional[datetime] = None
    assigned_sales_rep: Optional[str] = None
    
    # Analytics
    engagement_score: float = 0.0
    conversion_probability: float = 0.0
    estimated_value: Optional[float] = None
    
    # Notes and history
    notes: List[Dict[str, Any]] = None
    interaction_history: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.pain_points is None:
            self.pain_points = []
        if self.interests is None:
            self.interests = []
        if self.requirements is None:
            self.requirements = {}
        if self.notes is None:
            self.notes = []
        if self.interaction_history is None:
            self.interaction_history = []
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

@dataclass
class LeadQualificationCriteria:
    """Lead qualification criteria"""
    criteria_id: str
    name: str
    description: str
    weight: float
    questions: List[str]
    scoring_rules: Dict[str, Any]
    required: bool = False
    
@dataclass
class SalesOpportunity:
    """Sales opportunity definition"""
    opportunity_id: str
    lead_id: str
    name: str
    description: str
    value: float
    probability: float
    stage: str
    expected_close_date: Optional[datetime] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

@dataclass
class FollowUpTask:
    """Follow-up task definition"""
    task_id: str
    lead_id: str
    task_type: str  # call, email, demo, meeting
    description: str
    scheduled_date: datetime
    assigned_to: str
    priority: str = "medium"
    completed: bool = False
    completed_at: Optional[datetime] = None
    notes: str = ""
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)

class LeadManagementService:
    """
    Lead Management Service
    
    Provides comprehensive lead management capabilities for the Promethios Chat platform
    with intelligent qualification, scoring, and sales pipeline integration.
    """
    
    def __init__(self, governance_adapter=None, analytics_service=None, crm_integration=None):
        self.governance_adapter = governance_adapter
        self.analytics_service = analytics_service
        self.crm_integration = crm_integration
        
        # Lead storage
        self.leads = {}
        self.opportunities = {}
        self.followup_tasks = {}
        
        # Qualification system
        self.qualification_criteria = {}
        self.scoring_models = {}
        
        # Sales team
        self.sales_reps = {}
        
        # Configuration
        self.auto_qualification = True
        self.lead_scoring_enabled = True
        self.crm_sync_enabled = True
        
        # Performance metrics
        self.lead_metrics = {
            "total_leads": 0,
            "qualified_leads": 0,
            "conversion_rate": 0.0,
            "avg_lead_score": 0.0,
            "pipeline_value": 0.0
        }
        
        logger.info("🎯 [Leads] Lead management service initialized")
    
    async def initialize(self):
        """Initialize lead management service"""
        try:
            logger.info("🚀 [Leads] Initializing lead management service")
            
            # Load qualification criteria
            await self._load_qualification_criteria()
            
            # Load scoring models
            await self._load_scoring_models()
            
            # Load sales team
            await self._load_sales_team()
            
            # Start background tasks
            asyncio.create_task(self._followup_scheduler())
            asyncio.create_task(self._lead_scoring_updater())
            
            logger.info("✅ [Leads] Lead management service initialized")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Initialization failed: {e}")
            raise
    
    # ============================================================================
    # LEAD CAPTURE AND CREATION
    # ============================================================================
    
    async def capture_lead(self, conversation_data: Dict[str, Any]) -> str:
        """Capture a lead from conversation data"""
        try:
            logger.info(f"📥 [Leads] Capturing lead from conversation: {conversation_data.get('conversation_id')}")
            
            # Extract lead information from conversation
            lead_data = await self._extract_lead_data(conversation_data)
            
            # Create lead object
            lead = Lead(
                lead_id=str(uuid.uuid4()),
                conversation_id=conversation_data.get("conversation_id", ""),
                user_id=conversation_data.get("user_id", ""),
                chatbot_id=conversation_data.get("chatbot_id", ""),
                name=lead_data.get("name", ""),
                email=lead_data.get("email", ""),
                phone=lead_data.get("phone", ""),
                company=lead_data.get("company", ""),
                job_title=lead_data.get("job_title", ""),
                source=LeadSource.CHAT
            )
            
            # Store lead
            self.leads[lead.lead_id] = lead
            
            # Auto-qualify if enabled
            if self.auto_qualification:
                await self.qualify_lead(lead.lead_id, conversation_data)
            
            # Score lead if enabled
            if self.lead_scoring_enabled:
                await self.score_lead(lead.lead_id)
            
            # Sync with CRM if enabled
            if self.crm_sync_enabled and self.crm_integration:
                await self._sync_lead_to_crm(lead)
            
            # Log lead capture for governance
            if self.governance_adapter:
                await self.governance_adapter.createAuditEntry({
                    "interaction_id": f"lead_captured_{lead.lead_id}",
                    "agent_id": "lead_management_service",
                    "event_type": "lead_captured",
                    "lead_id": lead.lead_id,
                    "conversation_id": lead.conversation_id,
                    "source": lead.source.value,
                    "status": "success"
                })
            
            # Update metrics
            self.lead_metrics["total_leads"] += 1
            
            logger.info(f"✅ [Leads] Lead captured: {lead.lead_id}")
            return lead.lead_id
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to capture lead: {e}")
            return ""
    
    async def update_lead(self, lead_id: str, updates: Dict[str, Any]) -> bool:
        """Update lead information"""
        try:
            if lead_id not in self.leads:
                logger.warning(f"⚠️ [Leads] Lead not found: {lead_id}")
                return False
            
            lead = self.leads[lead_id]
            
            # Update fields
            for key, value in updates.items():
                if hasattr(lead, key):
                    setattr(lead, key, value)
            
            # Re-score lead if qualification data changed
            qualification_fields = ["budget", "timeline", "decision_maker", "pain_points", "interests"]
            if any(field in updates for field in qualification_fields):
                await self.score_lead(lead_id)
            
            # Sync with CRM
            if self.crm_sync_enabled and self.crm_integration:
                await self._sync_lead_to_crm(lead)
            
            logger.info(f"✅ [Leads] Lead updated: {lead_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to update lead: {e}")
            return False
    
    # ============================================================================
    # LEAD QUALIFICATION
    # ============================================================================
    
    async def qualify_lead(self, lead_id: str, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Qualify a lead based on conversation data and criteria"""
        try:
            logger.info(f"🔍 [Leads] Qualifying lead: {lead_id}")
            
            if lead_id not in self.leads:
                logger.error(f"❌ [Leads] Lead not found: {lead_id}")
                return {}
            
            lead = self.leads[lead_id]
            qualification_results = {}
            
            # Evaluate each qualification criteria
            for criteria in self.qualification_criteria.values():
                result = await self._evaluate_qualification_criteria(criteria, conversation_data, lead)
                qualification_results[criteria.criteria_id] = result
            
            # Calculate overall qualification score
            total_score = 0
            total_weight = 0
            
            for criteria_id, result in qualification_results.items():
                criteria = self.qualification_criteria[criteria_id]
                total_score += result["score"] * criteria.weight
                total_weight += criteria.weight
            
            overall_score = total_score / total_weight if total_weight > 0 else 0
            
            # Update lead qualification data
            lead.requirements.update({
                "qualification_score": overall_score,
                "qualification_results": qualification_results,
                "qualified_at": datetime.now(timezone.utc).isoformat()
            })
            
            # Determine qualification status
            if overall_score >= 0.7:
                lead.status = LeadStatus.QUALIFIED
                lead.priority = LeadPriority.HOT
            elif overall_score >= 0.5:
                lead.status = LeadStatus.QUALIFIED
                lead.priority = LeadPriority.WARM
            else:
                lead.status = LeadStatus.NURTURING
                lead.priority = LeadPriority.COLD
            
            # Create follow-up tasks for qualified leads
            if lead.status == LeadStatus.QUALIFIED:
                await self._create_followup_tasks(lead)
            
            logger.info(f"✅ [Leads] Lead qualified: {lead_id} (score: {overall_score:.2f})")
            
            return {
                "lead_id": lead_id,
                "qualification_score": overall_score,
                "status": lead.status.value,
                "priority": lead.priority.value,
                "results": qualification_results
            }
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to qualify lead: {e}")
            return {}
    
    async def score_lead(self, lead_id: str) -> float:
        """Calculate lead score using scoring models"""
        try:
            if lead_id not in self.leads:
                logger.error(f"❌ [Leads] Lead not found: {lead_id}")
                return 0.0
            
            lead = self.leads[lead_id]
            total_score = 0.0
            
            # Apply scoring models
            for model_name, model in self.scoring_models.items():
                model_score = await self._apply_scoring_model(model, lead)
                total_score += model_score
            
            # Normalize score (0-100)
            lead.score = min(100, max(0, total_score))
            
            # Update conversion probability
            lead.conversion_probability = await self._calculate_conversion_probability(lead)
            
            logger.info(f"📊 [Leads] Lead scored: {lead_id} (score: {lead.score:.1f})")
            return lead.score
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to score lead: {e}")
            return 0.0
    
    # ============================================================================
    # SALES PIPELINE MANAGEMENT
    # ============================================================================
    
    async def create_opportunity(self, lead_id: str, opportunity_data: Dict[str, Any]) -> str:
        """Create a sales opportunity from a qualified lead"""
        try:
            logger.info(f"💼 [Leads] Creating opportunity for lead: {lead_id}")
            
            if lead_id not in self.leads:
                logger.error(f"❌ [Leads] Lead not found: {lead_id}")
                return ""
            
            lead = self.leads[lead_id]
            
            # Create opportunity
            opportunity = SalesOpportunity(
                opportunity_id=str(uuid.uuid4()),
                lead_id=lead_id,
                name=opportunity_data.get("name", f"Opportunity for {lead.company or lead.name}"),
                description=opportunity_data.get("description", ""),
                value=opportunity_data.get("value", lead.estimated_value or 0),
                probability=opportunity_data.get("probability", lead.conversion_probability),
                stage=opportunity_data.get("stage", "qualification"),
                expected_close_date=opportunity_data.get("expected_close_date")
            )
            
            # Store opportunity
            self.opportunities[opportunity.opportunity_id] = opportunity
            
            # Update lead status
            lead.status = LeadStatus.INTERESTED
            
            # Assign sales rep if not already assigned
            if not lead.assigned_sales_rep:
                sales_rep = await self._assign_sales_rep(lead)
                if sales_rep:
                    lead.assigned_sales_rep = sales_rep["rep_id"]
            
            # Sync with CRM
            if self.crm_sync_enabled and self.crm_integration:
                await self._sync_opportunity_to_crm(opportunity)
            
            # Update metrics
            self.lead_metrics["pipeline_value"] += opportunity.value
            
            logger.info(f"✅ [Leads] Opportunity created: {opportunity.opportunity_id}")
            return opportunity.opportunity_id
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to create opportunity: {e}")
            return ""
    
    async def update_opportunity_stage(self, opportunity_id: str, stage: str, notes: str = "") -> bool:
        """Update opportunity stage in the sales pipeline"""
        try:
            if opportunity_id not in self.opportunities:
                logger.error(f"❌ [Leads] Opportunity not found: {opportunity_id}")
                return False
            
            opportunity = self.opportunities[opportunity_id]
            old_stage = opportunity.stage
            opportunity.stage = stage
            
            # Update lead status based on opportunity stage
            lead = self.leads[opportunity.lead_id]
            if stage == "closed_won":
                lead.status = LeadStatus.CLOSED_WON
                self.lead_metrics["qualified_leads"] += 1
            elif stage == "closed_lost":
                lead.status = LeadStatus.CLOSED_LOST
            elif stage == "proposal":
                lead.status = LeadStatus.PROPOSAL
            elif stage == "negotiation":
                lead.status = LeadStatus.NEGOTIATION
            
            # Add note about stage change
            if notes:
                lead.notes.append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "type": "stage_change",
                    "content": f"Stage changed from {old_stage} to {stage}: {notes}",
                    "author": "system"
                })
            
            # Sync with CRM
            if self.crm_sync_enabled and self.crm_integration:
                await self._sync_opportunity_to_crm(opportunity)
            
            logger.info(f"📈 [Leads] Opportunity stage updated: {opportunity_id} -> {stage}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to update opportunity stage: {e}")
            return False
    
    # ============================================================================
    # FOLLOW-UP MANAGEMENT
    # ============================================================================
    
    async def create_followup_task(self, task_data: Dict[str, Any]) -> str:
        """Create a follow-up task"""
        try:
            task = FollowUpTask(
                task_id=str(uuid.uuid4()),
                lead_id=task_data["lead_id"],
                task_type=task_data["task_type"],
                description=task_data["description"],
                scheduled_date=task_data["scheduled_date"],
                assigned_to=task_data["assigned_to"],
                priority=task_data.get("priority", "medium")
            )
            
            self.followup_tasks[task.task_id] = task
            
            # Update lead next followup date
            if task.lead_id in self.leads:
                lead = self.leads[task.lead_id]
                if not lead.next_followup or task.scheduled_date < lead.next_followup:
                    lead.next_followup = task.scheduled_date
            
            logger.info(f"📅 [Leads] Follow-up task created: {task.task_id}")
            return task.task_id
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to create follow-up task: {e}")
            return ""
    
    async def complete_followup_task(self, task_id: str, notes: str = "") -> bool:
        """Mark a follow-up task as completed"""
        try:
            if task_id not in self.followup_tasks:
                logger.error(f"❌ [Leads] Follow-up task not found: {task_id}")
                return False
            
            task = self.followup_tasks[task_id]
            task.completed = True
            task.completed_at = datetime.now(timezone.utc)
            task.notes = notes
            
            # Update lead last contact date
            if task.lead_id in self.leads:
                lead = self.leads[task.lead_id]
                lead.last_contact = datetime.now(timezone.utc)
                
                # Add interaction to history
                lead.interaction_history.append({
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "type": task.task_type,
                    "description": task.description,
                    "notes": notes,
                    "completed_by": task.assigned_to
                })
            
            logger.info(f"✅ [Leads] Follow-up task completed: {task_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to complete follow-up task: {e}")
            return False
    
    # ============================================================================
    # ANALYTICS AND REPORTING
    # ============================================================================
    
    async def get_lead_analytics(self, time_range: str = "30d") -> Dict[str, Any]:
        """Get lead analytics and performance metrics"""
        try:
            # Calculate time range
            now = datetime.now(timezone.utc)
            if time_range == "7d":
                start_date = now - timedelta(days=7)
            elif time_range == "30d":
                start_date = now - timedelta(days=30)
            elif time_range == "90d":
                start_date = now - timedelta(days=90)
            else:
                start_date = now - timedelta(days=30)
            
            # Filter leads by time range
            period_leads = [
                lead for lead in self.leads.values()
                if lead.created_at >= start_date
            ]
            
            # Calculate metrics
            total_leads = len(period_leads)
            qualified_leads = len([l for l in period_leads if l.status == LeadStatus.QUALIFIED])
            closed_won = len([l for l in period_leads if l.status == LeadStatus.CLOSED_WON])
            
            # Lead sources
            source_breakdown = {}
            for lead in period_leads:
                source = lead.source.value
                source_breakdown[source] = source_breakdown.get(source, 0) + 1
            
            # Lead scores
            lead_scores = [lead.score for lead in period_leads if lead.score > 0]
            avg_lead_score = sum(lead_scores) / len(lead_scores) if lead_scores else 0
            
            # Pipeline value
            pipeline_value = sum(opp.value for opp in self.opportunities.values())
            
            # Conversion rates
            qualification_rate = (qualified_leads / total_leads * 100) if total_leads > 0 else 0
            conversion_rate = (closed_won / total_leads * 100) if total_leads > 0 else 0
            
            return {
                "time_range": time_range,
                "period_start": start_date.isoformat(),
                "period_end": now.isoformat(),
                "lead_metrics": {
                    "total_leads": total_leads,
                    "qualified_leads": qualified_leads,
                    "closed_won": closed_won,
                    "qualification_rate": round(qualification_rate, 2),
                    "conversion_rate": round(conversion_rate, 2),
                    "avg_lead_score": round(avg_lead_score, 1)
                },
                "pipeline_metrics": {
                    "total_opportunities": len(self.opportunities),
                    "pipeline_value": pipeline_value,
                    "avg_deal_size": pipeline_value / len(self.opportunities) if self.opportunities else 0
                },
                "source_breakdown": source_breakdown,
                "performance": {
                    "avg_time_to_qualification": await self._calculate_avg_qualification_time(period_leads),
                    "avg_time_to_close": await self._calculate_avg_close_time(period_leads),
                    "followup_completion_rate": await self._calculate_followup_completion_rate()
                }
            }
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to get lead analytics: {e}")
            return {}
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    async def _extract_lead_data(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract lead information from conversation data"""
        try:
            # In real implementation, this would use NLP to extract information
            # from conversation messages
            
            messages = conversation_data.get("messages", [])
            lead_data = {}
            
            # Extract email addresses
            email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
            for message in messages:
                content = message.get("content", "")
                emails = re.findall(email_pattern, content)
                if emails:
                    lead_data["email"] = emails[0]
                    break
            
            # Extract phone numbers
            phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
            for message in messages:
                content = message.get("content", "")
                phones = re.findall(phone_pattern, content)
                if phones:
                    lead_data["phone"] = phones[0]
                    break
            
            # Extract company names (simple keyword matching)
            company_keywords = ["company", "organization", "business", "corp", "inc", "llc"]
            for message in messages:
                content = message.get("content", "").lower()
                for keyword in company_keywords:
                    if keyword in content:
                        # Extract potential company name
                        words = content.split()
                        for i, word in enumerate(words):
                            if keyword in word and i > 0:
                                lead_data["company"] = words[i-1].title()
                                break
                        break
            
            return lead_data
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to extract lead data: {e}")
            return {}
    
    async def _load_qualification_criteria(self):
        """Load lead qualification criteria"""
        try:
            # Default qualification criteria
            criteria = [
                LeadQualificationCriteria(
                    criteria_id="budget",
                    name="Budget Qualification",
                    description="Assess if lead has budget for solution",
                    weight=0.3,
                    questions=["What's your budget range?", "Have you allocated budget for this?"],
                    scoring_rules={"has_budget": 1.0, "no_budget": 0.0, "unknown": 0.5},
                    required=True
                ),
                LeadQualificationCriteria(
                    criteria_id="authority",
                    name="Decision Authority",
                    description="Assess if lead has decision-making authority",
                    weight=0.25,
                    questions=["Are you the decision maker?", "Who else is involved in the decision?"],
                    scoring_rules={"decision_maker": 1.0, "influencer": 0.7, "user": 0.3}
                ),
                LeadQualificationCriteria(
                    criteria_id="need",
                    name="Need Assessment",
                    description="Assess if lead has a genuine need",
                    weight=0.25,
                    questions=["What problem are you trying to solve?", "How urgent is this need?"],
                    scoring_rules={"urgent_need": 1.0, "moderate_need": 0.7, "nice_to_have": 0.3}
                ),
                LeadQualificationCriteria(
                    criteria_id="timeline",
                    name="Timeline Assessment",
                    description="Assess implementation timeline",
                    weight=0.2,
                    questions=["When do you need this implemented?", "What's driving the timeline?"],
                    scoring_rules={"immediate": 1.0, "3_months": 0.8, "6_months": 0.6, "1_year": 0.3}
                )
            ]
            
            for criterion in criteria:
                self.qualification_criteria[criterion.criteria_id] = criterion
            
            logger.info("✅ [Leads] Qualification criteria loaded")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to load qualification criteria: {e}")
    
    async def _load_scoring_models(self):
        """Load lead scoring models"""
        try:
            # Default scoring models
            self.scoring_models = {
                "demographic": {
                    "company_size": {"enterprise": 20, "mid_market": 15, "smb": 10, "startup": 5},
                    "job_title": {"ceo": 20, "cto": 18, "vp": 15, "director": 12, "manager": 8, "individual": 5},
                    "industry": {"technology": 15, "finance": 12, "healthcare": 10, "other": 5}
                },
                "behavioral": {
                    "engagement_score": {"high": 15, "medium": 10, "low": 5},
                    "response_time": {"immediate": 10, "fast": 8, "slow": 3},
                    "questions_asked": {"many": 10, "some": 7, "few": 3}
                },
                "firmographic": {
                    "revenue": {"100m+": 20, "10m-100m": 15, "1m-10m": 10, "under_1m": 5},
                    "employees": {"1000+": 15, "100-1000": 12, "10-100": 8, "under_10": 5}
                }
            }
            
            logger.info("✅ [Leads] Scoring models loaded")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to load scoring models: {e}")
    
    async def _load_sales_team(self):
        """Load sales team members"""
        try:
            # Default sales team
            self.sales_reps = {
                "rep_001": {
                    "rep_id": "rep_001",
                    "name": "John Smith",
                    "email": "john.smith@company.com",
                    "specializations": ["enterprise", "technology"],
                    "current_leads": 15,
                    "max_leads": 25,
                    "performance_rating": 4.5
                },
                "rep_002": {
                    "rep_id": "rep_002",
                    "name": "Sarah Davis",
                    "email": "sarah.davis@company.com",
                    "specializations": ["smb", "healthcare"],
                    "current_leads": 12,
                    "max_leads": 20,
                    "performance_rating": 4.3
                }
            }
            
            logger.info("✅ [Leads] Sales team loaded")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to load sales team: {e}")
    
    async def _evaluate_qualification_criteria(self, criteria: LeadQualificationCriteria, conversation_data: Dict[str, Any], lead: Lead) -> Dict[str, Any]:
        """Evaluate a specific qualification criteria"""
        try:
            # In real implementation, this would use NLP to analyze conversation
            # and determine qualification scores
            
            # Mock evaluation based on criteria type
            if criteria.criteria_id == "budget":
                # Check if budget was mentioned
                messages = conversation_data.get("messages", [])
                budget_mentioned = any("budget" in msg.get("content", "").lower() for msg in messages)
                score = 0.8 if budget_mentioned else 0.3
            elif criteria.criteria_id == "authority":
                # Check if decision maker was mentioned
                messages = conversation_data.get("messages", [])
                decision_maker = any("decision" in msg.get("content", "").lower() for msg in messages)
                score = 0.9 if decision_maker else 0.5
            elif criteria.criteria_id == "need":
                # Check urgency indicators
                messages = conversation_data.get("messages", [])
                urgent_keywords = ["urgent", "asap", "immediately", "critical"]
                urgent = any(keyword in msg.get("content", "").lower() for msg in messages for keyword in urgent_keywords)
                score = 0.9 if urgent else 0.6
            elif criteria.criteria_id == "timeline":
                # Check timeline mentions
                messages = conversation_data.get("messages", [])
                timeline_keywords = ["soon", "month", "quarter", "year"]
                timeline_mentioned = any(keyword in msg.get("content", "").lower() for msg in messages for keyword in timeline_keywords)
                score = 0.7 if timeline_mentioned else 0.4
            else:
                score = 0.5  # Default score
            
            return {
                "criteria_id": criteria.criteria_id,
                "score": score,
                "confidence": 0.8,
                "evidence": "Conversation analysis",
                "evaluated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to evaluate qualification criteria: {e}")
            return {"criteria_id": criteria.criteria_id, "score": 0.0, "confidence": 0.0}
    
    async def _apply_scoring_model(self, model: Dict[str, Any], lead: Lead) -> float:
        """Apply a scoring model to a lead"""
        try:
            score = 0.0
            
            # Apply demographic scoring
            if "demographic" in model:
                demo_model = model["demographic"]
                
                # Company size scoring (mock)
                if lead.company:
                    score += demo_model.get("company_size", {}).get("smb", 10)
                
                # Job title scoring (mock)
                if lead.job_title:
                    title_lower = lead.job_title.lower()
                    if "ceo" in title_lower or "president" in title_lower:
                        score += demo_model.get("job_title", {}).get("ceo", 20)
                    elif "cto" in title_lower or "vp" in title_lower:
                        score += demo_model.get("job_title", {}).get("vp", 15)
                    else:
                        score += demo_model.get("job_title", {}).get("manager", 8)
            
            return score
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to apply scoring model: {e}")
            return 0.0
    
    async def _calculate_conversion_probability(self, lead: Lead) -> float:
        """Calculate conversion probability based on lead data"""
        try:
            # Simple probability calculation based on score and qualification
            base_probability = lead.score / 100
            
            # Adjust based on qualification status
            if lead.status == LeadStatus.QUALIFIED:
                base_probability *= 1.5
            elif lead.status == LeadStatus.INTERESTED:
                base_probability *= 2.0
            elif lead.status == LeadStatus.PROPOSAL:
                base_probability *= 3.0
            
            # Cap at 95%
            return min(0.95, base_probability)
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to calculate conversion probability: {e}")
            return 0.0
    
    async def _create_followup_tasks(self, lead: Lead):
        """Create follow-up tasks for qualified leads"""
        try:
            # Create initial contact task
            await self.create_followup_task({
                "lead_id": lead.lead_id,
                "task_type": "call",
                "description": f"Initial contact call for {lead.name or lead.email}",
                "scheduled_date": datetime.now(timezone.utc) + timedelta(hours=2),
                "assigned_to": lead.assigned_sales_rep or "rep_001",
                "priority": "high" if lead.priority == LeadPriority.HOT else "medium"
            })
            
            # Create follow-up email task
            await self.create_followup_task({
                "lead_id": lead.lead_id,
                "task_type": "email",
                "description": f"Follow-up email with additional information",
                "scheduled_date": datetime.now(timezone.utc) + timedelta(days=1),
                "assigned_to": lead.assigned_sales_rep or "rep_001",
                "priority": "medium"
            })
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to create follow-up tasks: {e}")
    
    async def _assign_sales_rep(self, lead: Lead) -> Optional[Dict[str, Any]]:
        """Assign a sales rep to a lead"""
        try:
            # Find best available sales rep
            available_reps = [
                rep for rep in self.sales_reps.values()
                if rep["current_leads"] < rep["max_leads"]
            ]
            
            if not available_reps:
                return None
            
            # Sort by workload and performance
            available_reps.sort(key=lambda r: (r["current_leads"], -r["performance_rating"]))
            
            best_rep = available_reps[0]
            best_rep["current_leads"] += 1
            
            return best_rep
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to assign sales rep: {e}")
            return None
    
    async def _sync_lead_to_crm(self, lead: Lead):
        """Sync lead to CRM system"""
        try:
            # Mock CRM sync
            logger.info(f"🔄 [Leads] Syncing lead to CRM: {lead.lead_id}")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to sync lead to CRM: {e}")
    
    async def _sync_opportunity_to_crm(self, opportunity: SalesOpportunity):
        """Sync opportunity to CRM system"""
        try:
            # Mock CRM sync
            logger.info(f"🔄 [Leads] Syncing opportunity to CRM: {opportunity.opportunity_id}")
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to sync opportunity to CRM: {e}")
    
    async def _calculate_avg_qualification_time(self, leads: List[Lead]) -> float:
        """Calculate average time to qualification"""
        try:
            qualification_times = []
            for lead in leads:
                if lead.status == LeadStatus.QUALIFIED and "qualified_at" in lead.requirements:
                    qualified_at = datetime.fromisoformat(lead.requirements["qualified_at"].replace('Z', '+00:00'))
                    time_diff = (qualified_at - lead.created_at).total_seconds() / 3600  # hours
                    qualification_times.append(time_diff)
            
            return sum(qualification_times) / len(qualification_times) if qualification_times else 0
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to calculate avg qualification time: {e}")
            return 0
    
    async def _calculate_avg_close_time(self, leads: List[Lead]) -> float:
        """Calculate average time to close"""
        try:
            close_times = []
            for lead in leads:
                if lead.status == LeadStatus.CLOSED_WON:
                    # Mock close time calculation
                    close_times.append(30 * 24)  # 30 days in hours
            
            return sum(close_times) / len(close_times) if close_times else 0
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to calculate avg close time: {e}")
            return 0
    
    async def _calculate_followup_completion_rate(self) -> float:
        """Calculate follow-up task completion rate"""
        try:
            total_tasks = len(self.followup_tasks)
            completed_tasks = len([t for t in self.followup_tasks.values() if t.completed])
            
            return (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to calculate followup completion rate: {e}")
            return 0
    
    async def _followup_scheduler(self):
        """Background task to schedule follow-up reminders"""
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour
                
                current_time = datetime.now(timezone.utc)
                
                # Check for due follow-up tasks
                for task in self.followup_tasks.values():
                    if (not task.completed and 
                        task.scheduled_date <= current_time):
                        
                        logger.info(f"⏰ [Leads] Follow-up task due: {task.task_id}")
                        # Send reminder notification
                
            except Exception as e:
                logger.error(f"❌ [Leads] Follow-up scheduler error: {e}")
    
    async def _lead_scoring_updater(self):
        """Background task to update lead scores periodically"""
        while True:
            try:
                await asyncio.sleep(3600)  # Update every hour
                
                # Re-score all active leads
                for lead_id in self.leads:
                    if self.leads[lead_id].status not in [LeadStatus.CLOSED_WON, LeadStatus.CLOSED_LOST]:
                        await self.score_lead(lead_id)
                
            except Exception as e:
                logger.error(f"❌ [Leads] Lead scoring updater error: {e}")
    
    # ============================================================================
    # PUBLIC API METHODS
    # ============================================================================
    
    async def get_leads(self, status: LeadStatus = None, assigned_to: str = None) -> List[Dict[str, Any]]:
        """Get leads, optionally filtered by status or assignment"""
        leads = self.leads.values()
        
        if status:
            leads = [lead for lead in leads if lead.status == status]
        
        if assigned_to:
            leads = [lead for lead in leads if lead.assigned_sales_rep == assigned_to]
        
        return [asdict(lead) for lead in leads]
    
    async def get_opportunities(self, stage: str = None) -> List[Dict[str, Any]]:
        """Get opportunities, optionally filtered by stage"""
        opportunities = self.opportunities.values()
        
        if stage:
            opportunities = [opp for opp in opportunities if opp.stage == stage]
        
        return [asdict(opp) for opp in opportunities]
    
    async def get_followup_tasks(self, assigned_to: str = None, completed: bool = None) -> List[Dict[str, Any]]:
        """Get follow-up tasks, optionally filtered"""
        tasks = self.followup_tasks.values()
        
        if assigned_to:
            tasks = [task for task in tasks if task.assigned_to == assigned_to]
        
        if completed is not None:
            tasks = [task for task in tasks if task.completed == completed]
        
        return [asdict(task) for task in tasks]
    
    async def get_lead_metrics(self) -> Dict[str, Any]:
        """Get lead management metrics"""
        return {
            **self.lead_metrics,
            "analytics": await self.get_lead_analytics(),
            "sales_team_performance": await self._get_sales_team_performance()
        }
    
    async def _get_sales_team_performance(self) -> Dict[str, Any]:
        """Get sales team performance metrics"""
        try:
            team_metrics = {}
            
            for rep_id, rep in self.sales_reps.items():
                rep_leads = [lead for lead in self.leads.values() if lead.assigned_sales_rep == rep_id]
                closed_won = len([lead for lead in rep_leads if lead.status == LeadStatus.CLOSED_WON])
                
                team_metrics[rep_id] = {
                    "name": rep["name"],
                    "current_leads": rep["current_leads"],
                    "total_leads": len(rep_leads),
                    "closed_won": closed_won,
                    "conversion_rate": (closed_won / len(rep_leads) * 100) if rep_leads else 0,
                    "performance_rating": rep["performance_rating"]
                }
            
            return team_metrics
            
        except Exception as e:
            logger.error(f"❌ [Leads] Failed to get sales team performance: {e}")
            return {}

