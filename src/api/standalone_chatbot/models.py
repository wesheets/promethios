"""
Standalone Chatbot Data Models
SQLAlchemy models for the consumer chatbot system
"""

from sqlalchemy import Column, String, DateTime, Float, Integer, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import uuid
import secrets

Base = declarative_base()

class UserModel(Base):
    """User model for standalone chatbot system"""
    __tablename__ = "standalone_users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    display_name = Column(String)
    
    # Subscription and billing
    plan_tier = Column(String, default="free_trial")  # free_trial, starter, pro, enterprise
    trial_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=14))
    subscription_id = Column(String)  # Stripe subscription ID
    customer_id = Column(String)  # Stripe customer ID
    
    # Usage tracking
    chatbots_created = Column(Integer, default=0)
    messages_sent = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Account status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Firebase integration
    firebase_uid = Column(String, unique=True)
    
    # Relationships
    chatbots = relationship("ChatbotModel", back_populates="user")
    sessions = relationship("SessionModel", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.email}>"

class ChatbotModel(Base):
    """Chatbot model with governance integration"""
    __tablename__ = "standalone_chatbots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("standalone_users.id"), nullable=False)
    
    # Basic configuration
    name = Column(String, nullable=False)
    description = Column(Text)
    personality = Column(String, default="helpful_assistant")
    
    # API configuration
    api_provider = Column(String, nullable=False)  # anthropic, openai, custom
    api_endpoint = Column(String)
    api_key_encrypted = Column(String)  # Encrypted API key
    model_name = Column(String)
    
    # Governance configuration
    governance_profile_id = Column(String)  # Links to Promethios governance
    policy_set_id = Column(String)  # Links to Promethios policies
    trust_threshold = Column(Float, default=0.7)
    
    # Customization
    custom_instructions = Column(Text)
    system_prompt = Column(Text)
    
    # Widget configuration
    widget_theme = Column(String, default="dark")  # dark, light, auto
    widget_position = Column(String, default="bottom-right")
    widget_size = Column(String, default="medium")  # small, medium, large
    primary_color = Column(String, default="#6366f1")
    branding_level = Column(String, default="powered_by")  # powered_by, minimal, none
    
    # Status and metrics
    status = Column(String, default="creating")  # creating, active, paused, error
    trust_score = Column(Float, default=0.0)
    message_count = Column(Integer, default=0)
    last_message_at = Column(DateTime)
    
    # Embed configuration
    embed_code = Column(Text)
    embed_domain_whitelist = Column(Text)  # JSON array of allowed domains
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("UserModel", back_populates="chatbots")
    conversations = relationship("ConversationModel", back_populates="chatbot")
    
    def generate_embed_code(self):
        """Generate embed code for this chatbot"""
        return f"""
<script>
(function() {{
    var script = document.createElement('script');
    script.src = 'https://cdn.promethios.com/widget/chatbot.js';
    script.setAttribute('data-chatbot-id', '{self.id}');
    script.setAttribute('data-theme', '{self.widget_theme}');
    script.setAttribute('data-position', '{self.widget_position}');
    script.setAttribute('data-size', '{self.widget_size}');
    script.setAttribute('data-color', '{self.primary_color}');
    document.head.appendChild(script);
}})();
</script>
"""
    
    def __repr__(self):
        return f"<Chatbot {self.name}>"

class ConversationModel(Base):
    """Conversation tracking for analytics and governance"""
    __tablename__ = "standalone_conversations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chatbot_id = Column(String, ForeignKey("standalone_chatbots.id"), nullable=False)
    session_id = Column(String, nullable=False)
    
    # Message content
    user_message = Column(Text, nullable=False)
    bot_response = Column(Text, nullable=False)
    
    # Governance data
    trust_score = Column(Float)
    governance_status = Column(String)  # approved, flagged, blocked
    policy_violations = Column(Text)  # JSON array of violations
    processing_time_ms = Column(Integer)
    
    # Context
    user_ip = Column(String)
    user_agent = Column(String)
    referrer = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    chatbot = relationship("ChatbotModel", back_populates="conversations")
    
    def __repr__(self):
        return f"<Conversation {self.id}>"

class SessionModel(Base):
    """Session tracking for demo and widget usage"""
    __tablename__ = "standalone_sessions"
    
    session_id = Column(String, primary_key=True, default=lambda: secrets.token_urlsafe(32))
    user_id = Column(String, ForeignKey("standalone_users.id"), nullable=True)  # Null for demo sessions
    chatbot_id = Column(String, ForeignKey("standalone_chatbots.id"), nullable=True)  # Null for demo sessions
    
    # Session type
    session_type = Column(String, nullable=False)  # demo, widget, dashboard
    
    # Usage tracking
    message_count = Column(Integer, default=0)
    first_message_at = Column(DateTime)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Demo-specific
    ip_address = Column(String)
    user_agent = Column(String)
    converted_to_signup = Column(Boolean, default=False)
    
    # Widget-specific
    host_domain = Column(String)
    page_url = Column(String)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=24))
    
    # Relationships
    user = relationship("UserModel", back_populates="sessions")
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f"<Session {self.session_id}>"

class SponsorModel(Base):
    """Sponsor management for demo rotation"""
    __tablename__ = "standalone_sponsors"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Sponsor details
    name = Column(String, nullable=False)
    company = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)
    
    # Contract details
    tier = Column(String, nullable=False)  # basic, premium, enterprise
    monthly_fee = Column(Float, nullable=False)
    contract_start = Column(DateTime, nullable=False)
    contract_end = Column(DateTime, nullable=False)
    
    # Demo configuration
    api_provider = Column(String, nullable=False)
    api_key_encrypted = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    system_prompt = Column(Text)
    
    # Branding
    logo_url = Column(String)
    brand_color = Column(String)
    sponsor_message = Column(String)
    
    # Analytics and limits
    daily_session_limit = Column(Integer, default=500)
    monthly_budget = Column(Float, default=1000.0)
    current_month_spend = Column(Float, default=0.0)
    
    # Status
    is_active = Column(Boolean, default=True)
    priority_score = Column(Integer, default=1)  # Higher = more priority in rotation
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Sponsor {self.name}>"

class AnalyticsModel(Base):
    """Analytics and metrics tracking"""
    __tablename__ = "standalone_analytics"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Metric details
    metric_type = Column(String, nullable=False)  # demo_session, conversion, revenue, etc.
    metric_value = Column(Float, nullable=False)
    
    # Dimensions
    user_id = Column(String, ForeignKey("standalone_users.id"), nullable=True)
    chatbot_id = Column(String, ForeignKey("standalone_chatbots.id"), nullable=True)
    sponsor_id = Column(String, ForeignKey("standalone_sponsors.id"), nullable=True)
    
    # Context
    metadata = Column(Text)  # JSON metadata
    date_bucket = Column(DateTime, nullable=False)  # For time-series aggregation
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Analytics {self.metric_type}: {self.metric_value}>"

# Database utility functions
def create_tables(engine):
    """Create all tables"""
    Base.metadata.create_all(engine)

def get_user_by_email(session, email: str) -> UserModel:
    """Get user by email"""
    return session.query(UserModel).filter(UserModel.email == email).first()

def get_chatbot_by_id(session, chatbot_id: str, user_id: str) -> ChatbotModel:
    """Get chatbot by ID for specific user"""
    return session.query(ChatbotModel).filter(
        ChatbotModel.id == chatbot_id,
        ChatbotModel.user_id == user_id
    ).first()

def get_active_sponsor(session) -> SponsorModel:
    """Get currently active sponsor for demo"""
    return session.query(SponsorModel).filter(
        SponsorModel.is_active == True
    ).order_by(SponsorModel.priority_score.desc()).first()

def create_demo_session(session, ip_address: str) -> SessionModel:
    """Create new demo session"""
    demo_session = SessionModel(
        session_type="demo",
        ip_address=ip_address,
        first_message_at=datetime.utcnow()
    )
    session.add(demo_session)
    session.commit()
    return demo_session

