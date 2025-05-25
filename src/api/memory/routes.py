"""
Memory routes module compatibility fix.

This module modifies the memory routes to use the compatibility layer.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field

# Import from compatibility layer instead of direct import
import sys
import importlib.util

# Create a direct reference to the compatibility class
from src.api.schema_validation.registry import SchemaRegistry

# Define API models
class MemoryRecord(BaseModel):
    """Model representing a memory record."""
    memory_id: str
    content: Dict[str, Any]
    timestamp: str
    tags: List[str]

class MemoryQuery(BaseModel):
    """Model for memory query parameters."""
    agent_id: str
    memory_type: Optional[str] = None
    tags: List[str] = []
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    limit: int = 100

class MemoryStats(BaseModel):
    """Model for memory statistics."""
    total_memories: int
    memory_types: Dict[str, int]
    
class MemoryRouter:
    """Router for memory API endpoints."""
    def __init__(self):
        self.router = APIRouter()
        self.schema_registry = SchemaRegistry()
