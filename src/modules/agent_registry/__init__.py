"""
Agent Registry Module for Promethios.

This module provides comprehensive agent management including:
- Agent registration and validation
- Agent discovery and matching
- Agent lifecycle management
- Governance integration
- Performance tracking
"""

from .simple_agent_registry import AgentRegistry, AgentType, AgentStatus

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "AgentRegistry",
    "AgentType", 
    "AgentStatus"
]

