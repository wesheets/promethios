"""
Standalone Chatbot Services
Business logic for the consumer chatbot system
"""

import asyncio
import json
import secrets
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from cryptography.fernet import Fernet
import bcrypt
import jwt
import stripe
import httpx

from .models import UserModel, ChatbotModel, SessionModel, ConversationModel, SponsorModel
from .demo_config import CURRENT_DEMO_CONFIG
from ..agents.routes import call_agent_system, call_governance_orchestrator
from ..chat.ai_model_service import ai_model_service

class UserService:
    """User management and authentication service"""
    
    def __init__(self):
        self.secret_key = "your-secret-key"  # Should be from environment
        self.encryption_key = Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
    
    async def create_user(self, email: str, password: str) -> UserModel:
        """Create new user with trial account"""
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        user = UserModel(
            email=email,
            password_hash=password_hash.decode('utf-8'),
            plan_tier="free_trial",
            trial_expires_at=datetime.utcnow() + timedelta(days=14)
        )
        
        # Save to database (pseudo-code)
        # session.add(user)
        # session.commit()
        
        return user
    
    async def authenticate_user(self, email: str, password: str) -> str:
        """Authenticate user and return JWT token"""
        # Get user from database
        # user = get_user_by_email(session, email)
        
        # Verify password
        # if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        #     raise ValueError("Invalid credentials")
        
        # Generate JWT token
        payload = {
            "user_id": "user.id",
            "email": email,
            "exp": datetime.utcnow() + timedelta(hours=24)
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm="HS256")
        return token
    
    async def get_user_from_token(self, token: str) -> UserModel:
        """Get user from JWT token"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=["HS256"])
            user_id = payload["user_id"]
            
            # Get user from database
            # user = session.query(UserModel).filter(UserModel.id == user_id).first()
            # return user
            
            # Mock user for now
            return UserModel(id=user_id, email=payload["email"])
            
        except jwt.ExpiredSignatureError:
            raise ValueError("Token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    async def check_chatbot_limits(self, user: UserModel):
        """Check if user can create more chatbots"""
        limits = {
            "free_trial": 5,
            "starter": 25,
            "pro": 100,
            "enterprise": -1  # Unlimited
        }
        
        limit = limits.get(user.plan_tier, 5)
        if limit != -1 and user.chatbots_created >= limit:
            raise ValueError(f"Chatbot limit reached for {user.plan_tier} plan")
    
    async def check_message_limits(self, user: UserModel):
        """Check if user can send more messages"""
        limits = {
            "free_trial": 1000,
            "starter": 10000,
            "pro": 50000,
            "enterprise": -1  # Unlimited
        }
        
        limit = limits.get(user.plan_tier, 1000)
        if limit != -1 and user.messages_sent >= limit:
            raise ValueError(f"Message limit reached for {user.plan_tier} plan")
    
    async def upgrade_subscription(self, user_id: str, plan: str) -> Dict[str, Any]:
        """Upgrade user subscription via Stripe"""
        # Stripe integration
        prices = {
            "starter": "price_starter_monthly",
            "pro": "price_pro_monthly", 
            "enterprise": "price_enterprise_monthly"
        }
        
        # Create Stripe subscription
        # subscription = stripe.Subscription.create(
        #     customer=user.customer_id,
        #     items=[{"price": prices[plan]}]
        # )
        
        return {"status": "success", "plan": plan}
    
    async def send_welcome_email(self, email: str):
        """Send welcome email to new user"""
        # Email service integration
        pass
    
    async def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user usage statistics"""
        return {
            "chatbots_created": 3,
            "messages_sent": 150,
            "trial_days_remaining": 10
        }
    
    async def get_plan_limits(self, plan_tier: str) -> Dict[str, Any]:
        """Get limits for plan tier"""
        limits = {
            "free_trial": {"chatbots": 5, "messages": 1000},
            "starter": {"chatbots": 25, "messages": 10000},
            "pro": {"chatbots": 100, "messages": 50000},
            "enterprise": {"chatbots": -1, "messages": -1}
        }
        
        return limits.get(plan_tier, limits["free_trial"])

class ChatbotService:
    """Chatbot creation and management service"""
    
    def __init__(self):
        self.encryption_key = Fernet.generate_key()
        self.fernet = Fernet(self.encryption_key)
    
    async def create_chatbot(
        self,
        user_id: str,
        name: str,
        description: str,
        personality: str,
        api_provider: str,
        api_endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        custom_instructions: Optional[str] = None
    ) -> ChatbotModel:
        """Create new chatbot with governance wrapper"""
        
        # Encrypt API key if provided
        encrypted_key = None
        if api_key:
            encrypted_key = self.fernet.encrypt(api_key.encode()).decode()
        
        # Map personality to governance profile
        governance_profile = self._map_personality_to_governance(personality)
        
        # Create chatbot model
        chatbot = ChatbotModel(
            user_id=user_id,
            name=name,
            description=description,
            personality=personality,
            api_provider=api_provider,
            api_endpoint=api_endpoint,
            api_key_encrypted=encrypted_key,
            governance_profile_id=governance_profile["id"],
            policy_set_id=governance_profile["policy_set"],
            custom_instructions=custom_instructions,
            status="creating"
        )
        
        # Generate embed code
        chatbot.embed_code = chatbot.generate_embed_code()
        
        # Save to database
        # session.add(chatbot)
        # session.commit()
        
        return chatbot
    
    def _map_personality_to_governance(self, personality: str) -> Dict[str, str]:
        """Map personality to governance configuration"""
        mappings = {
            "helpful_assistant": {
                "id": "governance_helpful",
                "policy_set": "standard_safety"
            },
            "customer_support": {
                "id": "governance_support", 
                "policy_set": "professional_tone"
            },
            "sales_assistant": {
                "id": "governance_sales",
                "policy_set": "persuasive_ethical"
            },
            "technical_expert": {
                "id": "governance_technical",
                "policy_set": "accuracy_focused"
            }
        }
        
        return mappings.get(personality, mappings["helpful_assistant"])
    
    async def wrap_agent_async(self, chatbot_id: str):
        """Wrap agent with governance in background"""
        try:
            # Get chatbot
            # chatbot = session.query(ChatbotModel).filter(ChatbotModel.id == chatbot_id).first()
            
            # Call existing Promethios agent wrapper
            wrapper_config = {
                "name": f"chatbot_{chatbot_id}",
                "api_provider": "chatbot.api_provider",
                "api_endpoint": "chatbot.api_endpoint", 
                "governance_profile": "chatbot.governance_profile_id",
                "environment": "production"  # Always production for paying customers
            }
            
            # result = await call_agent_system("wrap_agent", wrapper_config)
            
            # Update chatbot status
            # chatbot.status = "active"
            # chatbot.trust_score = result.get("initial_trust_score", 0.8)
            # session.commit()
            
        except Exception as e:
            # Update status to error
            # chatbot.status = "error"
            # session.commit()
            pass
    
    async def get_user_chatbots(self, user_id: str) -> List[ChatbotModel]:
        """Get all chatbots for user"""
        # return session.query(ChatbotModel).filter(ChatbotModel.user_id == user_id).all()
        
        # Mock data for now
        return [
            ChatbotModel(
                id="bot1",
                name="Customer Support Bot",
                description="Helps customers with questions",
                personality="customer_support",
                status="active",
                trust_score=0.92,
                message_count=1250
            )
        ]
    
    async def get_chatbot(self, chatbot_id: str, user_id: str) -> ChatbotModel:
        """Get specific chatbot"""
        # return get_chatbot_by_id(session, chatbot_id, user_id)
        
        # Mock data
        return ChatbotModel(
            id=chatbot_id,
            name="Test Bot",
            status="active",
            trust_score=0.88
        )
    
    async def send_message(self, chatbot_id: str, user_id: str, message: str) -> Dict[str, Any]:
        """Send message to chatbot through governance"""
        try:
            # Get chatbot configuration
            # chatbot = await self.get_chatbot(chatbot_id, user_id)
            
            # Call governance orchestrator
            governance_request = {
                "agent_id": chatbot_id,
                "message": message,
                "user_context": {"user_id": user_id}
            }
            
            # response = await call_governance_orchestrator(governance_request)
            
            # Mock response for now
            response = {
                "response": "I'm a governed AI assistant. How can I help you today?",
                "trust_score": 0.91,
                "governance_status": "approved",
                "policy_checks": ["Content Safety ✓", "Professional Tone ✓"],
                "processing_time_ms": 245
            }
            
            # Log conversation
            await self._log_conversation(chatbot_id, message, response)
            
            return response
            
        except Exception as e:
            raise ValueError(f"Message processing error: {str(e)}")
    
    async def _log_conversation(self, chatbot_id: str, user_message: str, response: Dict[str, Any]):
        """Log conversation for analytics"""
        conversation = ConversationModel(
            chatbot_id=chatbot_id,
            session_id=secrets.token_urlsafe(16),
            user_message=user_message,
            bot_response=response["response"],
            trust_score=response["trust_score"],
            governance_status=response["governance_status"],
            processing_time_ms=response["processing_time_ms"]
        )
        
        # session.add(conversation)
        # session.commit()
    
    async def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """Get analytics for user's chatbots"""
        return {
            "total_chatbots": 3,
            "total_messages": 1250,
            "avg_trust_score": 0.89,
            "active_conversations": 15,
            "monthly_usage": {
                "messages": 850,
                "unique_users": 45,
                "avg_response_time": 320
            }
        }
    
    async def get_widget_config(self, chatbot_id: str) -> Dict[str, Any]:
        """Get widget configuration for embedding"""
        # chatbot = session.query(ChatbotModel).filter(ChatbotModel.id == chatbot_id).first()
        
        return {
            "chatbot_id": chatbot_id,
            "theme": "dark",
            "position": "bottom-right",
            "size": "medium",
            "primary_color": "#6366f1",
            "branding": "powered_by"
        }
    
    async def send_widget_message(self, chatbot_id: str, message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Send message through embedded widget"""
        # Similar to send_message but for public widget
        return await self.send_message(chatbot_id, "widget_user", message)

class DemoService:
    """Demo chatbot service for landing page"""
    
    def __init__(self):
        self.scripted_responses = {
            3: {
                "content": "🎯 You're experiencing real Promethios governance! Notice the trust score and policy checks. Want to create your own chatbot? [Start Free Trial]",
                "trust_score": 0.94,
                "governance_status": "approved",
                "policy_checks": ["Content Safety ✓", "Professional Tone ✓", "Governance Demo ✓"],
                "show_signup_prompt": True
            },
            4: {
                "content": "What makes this different? **Governance transparency!** Every response is verified with real-time trust scoring. Ready to build your own?",
                "trust_score": 0.92,
                "governance_status": "approved", 
                "policy_checks": ["Transparency Demo ✓", "Educational Content ✓"],
                "show_signup_prompt": True
            },
            5: {
                "content": "🚀 **Demo Complete!** You've experienced governed AI with transparency. Create unlimited chatbots with your free trial! [Sign Up Now]",
                "trust_score": 0.96,
                "governance_status": "approved",
                "policy_checks": ["Demo Complete ✓", "Conversion Optimized ✓"],
                "show_signup_prompt": True
            }
        }
    
    async def get_or_create_session(self, session_id: Optional[str] = None) -> SessionModel:
        """Get existing session or create new one"""
        if session_id:
            # session = session.query(SessionModel).filter(SessionModel.session_id == session_id).first()
            # if session and not session.is_expired():
            #     return session
            pass
        
        # Create new session
        demo_session = SessionModel(
            session_type="demo",
            ip_address="127.0.0.1",  # Should get from request
            first_message_at=datetime.utcnow()
        )
        
        return demo_session
    
    async def call_real_api(self, message: str, session: SessionModel) -> Dict[str, Any]:
        """Call real API with governance for authentic demo"""
        try:
            # Use existing AI model service
            # response = await ai_model_service.generate_response(
            #     provider=CURRENT_DEMO_CONFIG.provider,
            #     model=CURRENT_DEMO_CONFIG.model,
            #     message=message,
            #     system_prompt=CURRENT_DEMO_CONFIG.system_prompt
            # )
            
            # Mock governance response
            response = {
                "content": f"I'm Claude, powered by Anthropic and governed by Promethios. I can help you with questions while maintaining transparency and trust. You asked: '{message[:50]}...'",
                "trust_score": 0.89,
                "governance_status": "approved",
                "policy_checks": ["Content Safety ✓", "Professional Tone ✓", "Real API ✓"],
                "show_signup_prompt": False
            }
            
            return response
            
        except Exception as e:
            # Fallback to scripted response
            return self.scripted_responses[3]
    
    async def get_scripted_response(self, message_number: int, user_message: str) -> Dict[str, Any]:
        """Get scripted response optimized for conversion"""
        return self.scripted_responses.get(message_number, self.scripted_responses[5])
    
    async def update_session(self, session: SessionModel):
        """Update session in database"""
        # session.commit()
        pass
    
    async def get_system_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        return {
            "demo_sessions": 1250,
            "active_chatbots": 450,
            "total_messages": 15000,
            "avg_trust_score": 0.91
        }

class NotificationService:
    """Notification and email service"""
    
    async def send_email(self, to_email: str, subject: str, content: str):
        """Send email notification"""
        # SendGrid or similar integration
        pass
    
    async def send_trial_expiry_warning(self, user: UserModel):
        """Send trial expiry warning"""
        await self.send_email(
            user.email,
            "Your Promethios trial expires soon",
            f"Hi {user.display_name}, your trial expires in 3 days. Upgrade to continue using governed AI."
        )
    
    async def send_governance_alert(self, user: UserModel, chatbot: ChatbotModel, alert: str):
        """Send governance policy violation alert"""
        await self.send_email(
            user.email,
            f"Governance Alert: {chatbot.name}",
            f"Your chatbot '{chatbot.name}' triggered a governance alert: {alert}"
        )

