"""
Standalone Chatbot API Routes
FastAPI routes for the consumer-friendly chatbot system
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime, timedelta

from .models import ChatbotModel, UserModel, SessionModel
from .services import ChatbotService, UserService, DemoService
from .demo_config import CURRENT_DEMO_CONFIG
from ..agents.routes import call_agent_system, call_governance_orchestrator
from ..chat.ai_model_service import ai_model_service

router = APIRouter(prefix="/api/standalone-chatbot", tags=["standalone-chatbot"])
security = HTTPBearer()

# Pydantic Models for API
class ChatbotCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    personality: str = "helpful_assistant"
    api_provider: str = "anthropic"
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    custom_instructions: Optional[str] = ""

class ChatbotResponse(BaseModel):
    id: str
    name: str
    description: str
    personality: str
    status: str
    created_at: datetime
    embed_code: str
    trust_score: float
    message_count: int

class DemoMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class DemoMessageResponse(BaseModel):
    response: str
    trust_score: float
    governance_status: str
    policy_checks: List[str]
    session_id: str
    messages_remaining: int
    show_signup_prompt: bool
    sponsor_info: Dict[str, Any]

# Demo Endpoints
@router.post("/demo/message", response_model=DemoMessageResponse)
async def send_demo_message(request: DemoMessageRequest):
    """Send message to demo chatbot with governance showcase"""
    try:
        demo_service = DemoService()
        
        # Check session limits and create/validate session
        session = await demo_service.get_or_create_session(request.session_id)
        
        if session.message_count >= CURRENT_DEMO_CONFIG.max_messages_per_session:
            raise HTTPException(
                status_code=429, 
                detail="Demo limit reached. Sign up for unlimited messages!"
            )
        
        # Determine if this should be a real API call or scripted response
        if session.message_count < CURRENT_DEMO_CONFIG.real_api_messages:
            # Real API call with governance
            response = await demo_service.call_real_api(request.message, session)
        else:
            # Scripted response optimized for conversion
            response = await demo_service.get_scripted_response(
                session.message_count + 1, 
                request.message
            )
        
        # Update session
        session.message_count += 1
        session.last_activity = datetime.utcnow()
        await demo_service.update_session(session)
        
        return DemoMessageResponse(
            response=response["content"],
            trust_score=response["trust_score"],
            governance_status=response["governance_status"],
            policy_checks=response["policy_checks"],
            session_id=session.session_id,
            messages_remaining=CURRENT_DEMO_CONFIG.max_messages_per_session - session.message_count,
            show_signup_prompt=response.get("show_signup_prompt", False),
            sponsor_info={
                "name": CURRENT_DEMO_CONFIG.sponsor_name,
                "logo_url": CURRENT_DEMO_CONFIG.sponsor_logo_url,
                "message": CURRENT_DEMO_CONFIG.sponsor_message
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo error: {str(e)}")

@router.get("/demo/config")
async def get_demo_config():
    """Get demo configuration for frontend"""
    return {
        "provider": CURRENT_DEMO_CONFIG.provider,
        "model": CURRENT_DEMO_CONFIG.model,
        "max_messages": CURRENT_DEMO_CONFIG.max_messages_per_session,
        "sponsor": {
            "name": CURRENT_DEMO_CONFIG.sponsor_name,
            "logo_url": CURRENT_DEMO_CONFIG.sponsor_logo_url,
            "message": CURRENT_DEMO_CONFIG.sponsor_message
        }
    }

# User Management
@router.post("/auth/signup")
async def signup_user(email: str, password: str, background_tasks: BackgroundTasks):
    """Sign up new user with trial account"""
    try:
        user_service = UserService()
        user = await user_service.create_user(email, password)
        
        # Send welcome email in background
        background_tasks.add_task(user_service.send_welcome_email, user.email)
        
        return {"user_id": user.id, "trial_expires": user.trial_expires_at}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/login")
async def login_user(email: str, password: str):
    """Login user and return access token"""
    try:
        user_service = UserService()
        token = await user_service.authenticate_user(email, password)
        return {"access_token": token, "token_type": "bearer"}
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

# Chatbot Management
@router.post("/chatbots", response_model=ChatbotResponse)
async def create_chatbot(
    request: ChatbotCreateRequest, 
    background_tasks: BackgroundTasks,
    token: str = Depends(security)
):
    """Create new governed chatbot"""
    try:
        chatbot_service = ChatbotService()
        user_service = UserService()
        
        # Validate user and subscription
        user = await user_service.get_user_from_token(token.credentials)
        await user_service.check_chatbot_limits(user)
        
        # Create chatbot with governance wrapper
        chatbot = await chatbot_service.create_chatbot(
            user_id=user.id,
            name=request.name,
            description=request.description,
            personality=request.personality,
            api_provider=request.api_provider,
            api_endpoint=request.api_endpoint,
            api_key=request.api_key,
            custom_instructions=request.custom_instructions
        )
        
        # Start agent wrapping process in background
        background_tasks.add_task(
            chatbot_service.wrap_agent_async, 
            chatbot.id
        )
        
        return ChatbotResponse(
            id=chatbot.id,
            name=chatbot.name,
            description=chatbot.description,
            personality=chatbot.personality,
            status=chatbot.status,
            created_at=chatbot.created_at,
            embed_code=chatbot.embed_code,
            trust_score=chatbot.trust_score,
            message_count=chatbot.message_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chatbots", response_model=List[ChatbotResponse])
async def list_chatbots(token: str = Depends(security)):
    """List user's chatbots"""
    try:
        chatbot_service = ChatbotService()
        user_service = UserService()
        
        user = await user_service.get_user_from_token(token.credentials)
        chatbots = await chatbot_service.get_user_chatbots(user.id)
        
        return [
            ChatbotResponse(
                id=bot.id,
                name=bot.name,
                description=bot.description,
                personality=bot.personality,
                status=bot.status,
                created_at=bot.created_at,
                embed_code=bot.embed_code,
                trust_score=bot.trust_score,
                message_count=bot.message_count
            )
            for bot in chatbots
        ]
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/chatbots/{chatbot_id}")
async def get_chatbot(chatbot_id: str, token: str = Depends(security)):
    """Get specific chatbot details"""
    try:
        chatbot_service = ChatbotService()
        user_service = UserService()
        
        user = await user_service.get_user_from_token(token.credentials)
        chatbot = await chatbot_service.get_chatbot(chatbot_id, user.id)
        
        return ChatbotResponse(
            id=chatbot.id,
            name=chatbot.name,
            description=chatbot.description,
            personality=chatbot.personality,
            status=chatbot.status,
            created_at=chatbot.created_at,
            embed_code=chatbot.embed_code,
            trust_score=chatbot.trust_score,
            message_count=chatbot.message_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=404, detail="Chatbot not found")

@router.post("/chatbots/{chatbot_id}/message")
async def send_chatbot_message(
    chatbot_id: str, 
    message: str, 
    token: str = Depends(security)
):
    """Send message to specific chatbot"""
    try:
        chatbot_service = ChatbotService()
        user_service = UserService()
        
        user = await user_service.get_user_from_token(token.credentials)
        
        # Check usage limits
        await user_service.check_message_limits(user)
        
        # Send message through governance system
        response = await chatbot_service.send_message(
            chatbot_id=chatbot_id,
            user_id=user.id,
            message=message
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Analytics and Monitoring
@router.get("/analytics/dashboard")
async def get_analytics_dashboard(token: str = Depends(security)):
    """Get user analytics dashboard data"""
    try:
        user_service = UserService()
        chatbot_service = ChatbotService()
        
        user = await user_service.get_user_from_token(token.credentials)
        analytics = await chatbot_service.get_user_analytics(user.id)
        
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Billing and Subscription
@router.get("/billing/status")
async def get_billing_status(token: str = Depends(security)):
    """Get user billing and subscription status"""
    try:
        user_service = UserService()
        user = await user_service.get_user_from_token(token.credentials)
        
        return {
            "plan": user.plan_tier,
            "trial_expires": user.trial_expires_at,
            "usage": await user_service.get_usage_stats(user.id),
            "limits": await user_service.get_plan_limits(user.plan_tier)
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/billing/upgrade")
async def upgrade_subscription(plan: str, token: str = Depends(security)):
    """Upgrade user subscription plan"""
    try:
        user_service = UserService()
        user = await user_service.get_user_from_token(token.credentials)
        
        # Process upgrade through Stripe
        result = await user_service.upgrade_subscription(user.id, plan)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Widget and Embed
@router.get("/widget/{chatbot_id}")
async def get_widget_config(chatbot_id: str):
    """Get widget configuration for embedding"""
    try:
        chatbot_service = ChatbotService()
        config = await chatbot_service.get_widget_config(chatbot_id)
        
        return config
        
    except Exception as e:
        raise HTTPException(status_code=404, detail="Widget not found")

@router.post("/widget/{chatbot_id}/message")
async def widget_message(chatbot_id: str, message: str, session_id: Optional[str] = None):
    """Send message through embedded widget"""
    try:
        chatbot_service = ChatbotService()
        
        response = await chatbot_service.send_widget_message(
            chatbot_id=chatbot_id,
            message=message,
            session_id=session_id
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Health and Status
@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

@router.get("/status")
async def system_status():
    """System status with metrics"""
    try:
        demo_service = DemoService()
        stats = await demo_service.get_system_stats()
        
        return {
            "status": "operational",
            "demo_sessions_today": stats["demo_sessions"],
            "active_chatbots": stats["active_chatbots"],
            "total_messages": stats["total_messages"],
            "governance_score": stats["avg_trust_score"]
        }
        
    except Exception as e:
        return {"status": "degraded", "error": str(e)}

