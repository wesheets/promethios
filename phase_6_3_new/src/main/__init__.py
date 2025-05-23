"""
Python package initialization for main module.

This module contains the main application entry point and runtime components.
Codex Contract: v2025.05.20
Phase ID: 5.7
Clauses: 5.7, 11.0
"""

# Import the runtime executor
from src.main.runtime_executor import RuntimeExecutor, load_schema, validate_against_schema, pre_loop_tether_check

__all__ = ['RuntimeExecutor', 'load_schema', 'validate_against_schema', 'pre_loop_tether_check']
