"""
Persona Registry Module for Promethios.

This module provides comprehensive persona management including:
- Persona definition and registration
- Personality trait modeling
- Role-based behavior configuration
- Persona governance integration
- Persona adaptation and learning
"""

from .persona_registry import PersonaRegistry
from .personality_modeler import PersonalityModeler
from .role_manager import RoleManager
from .persona_adapter import PersonaAdapter

__version__ = "1.0.0"
__author__ = "Promethios Team"

__all__ = [
    "PersonaRegistry",
    "PersonalityModeler",
    "RoleManager",
    "PersonaAdapter"
]

