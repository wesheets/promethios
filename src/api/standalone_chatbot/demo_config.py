"""
Demo Configuration for Promethios Standalone Chatbot
Handles demo bot configuration with environment-based API keys
"""

import os
from dataclasses import dataclass
from typing import Optional

@dataclass
class DemoConfig:
    """Configuration for demo chatbot"""
    provider: str
    api_key: str
    model: str
    system_prompt: str
    max_messages_per_session: int
    max_sessions_per_ip_per_day: int
    session_timeout_minutes: int
    daily_cost_limit: float
    real_api_messages: int
    scripted_messages: int
    sponsor_name: Optional[str] = None
    sponsor_logo_url: Optional[str] = None
    sponsor_message: Optional[str] = None

# Current Demo Configuration (Environment-based)
CURRENT_DEMO_CONFIG = DemoConfig(
    provider="anthropic",
    api_key=os.getenv("ANTHROPIC_API_KEY", ""),
    model="claude-3-haiku-20240307",
    system_prompt="""You are a helpful AI assistant demonstrating Promethios governance capabilities. 
Your responses showcase real-time trust scoring, policy compliance, and transparency.""",
    max_messages_per_session=5,
    max_sessions_per_ip_per_day=3,
    session_timeout_minutes=30,
    daily_cost_limit=50.0,
    real_api_messages=2,
    scripted_messages=3,
    sponsor_name="Anthropic",
    sponsor_logo_url="https://cdn.promethios.com/sponsors/anthropic-logo.png",
    sponsor_message="This demo is powered by Anthropic's Claude with Promethios governance"
)

