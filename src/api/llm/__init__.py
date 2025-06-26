"""
Promethios LLM Integration Module

This module provides the LLM service that acts as an intelligent interface
layer coordinating with existing Promethios systems rather than duplicating
functionality.

Key Components:
- PrometheusLLMService: Main coordination service
- LLM API Routes: REST endpoints for user interaction
- Integration with existing multi-agent, trust, and governance systems

This represents the V2 streamlined user experience where users simply
describe what they want and the system coordinates appropriate agents
automatically using existing Promethios infrastructure.
"""

from .promethios_llm_service import (
    promethios_llm_service,
    PrometheusLLMService,
    LLMRequest,
    LLMResponse
)

from .routes import router as llm_router

__all__ = [
    "promethios_llm_service",
    "PrometheusLLMService", 
    "LLMRequest",
    "LLMResponse",
    "llm_router"
]

