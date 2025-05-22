"""
API routes for the Memory API in Promethios.

This module defines the routes for the Memory API, which is responsible for
managing agent memory operations including logging, retrieval, and manipulation.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field

from ..schema_validation.registry import SchemaRegistry

# Define API models
class MemoryLogRequest(BaseModel):
    """Request model for logging memory entries."""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the current task")
    memory_type: str = Field(..., description="Type of memory (e.g., episodic, semantic, procedural)")
    content: Dict[str, Any] = Field(..., description="Memory content to be logged")
    timestamp: Optional[str] = Field(None, description="Optional timestamp (ISO format)")
    tags: List[str] = Field(default_factory=list, description="Optional tags for categorization")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "task_id": "task-456",
                "memory_type": "episodic",
                "content": {
                    "action": "file_read",
                    "path": "/home/user/document.txt",
                    "result": "success"
                },
                "timestamp": "2025-05-22T03:45:12Z",
                "tags": ["file_operation", "read"]
            }
        }

class MemoryLogResponse(BaseModel):
    """Response model for memory logging operations."""
    memory_id: str = Field(..., description="Unique identifier for the logged memory")
    status: str = Field(..., description="Status of the operation")
    timestamp: str = Field(..., description="Timestamp of the operation (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "memory_id": "mem-789",
                "status": "success",
                "timestamp": "2025-05-22T03:45:12Z"
            }
        }

class MemoryQueryRequest(BaseModel):
    """Request model for querying memory entries."""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    memory_type: Optional[str] = Field(None, description="Optional filter by memory type")
    tags: List[str] = Field(default_factory=list, description="Optional filter by tags")
    start_time: Optional[str] = Field(None, description="Optional start time filter (ISO format)")
    end_time: Optional[str] = Field(None, description="Optional end time filter (ISO format)")
    limit: int = Field(100, description="Maximum number of results to return")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "memory_type": "episodic",
                "tags": ["file_operation"],
                "start_time": "2025-05-21T00:00:00Z",
                "end_time": "2025-05-22T23:59:59Z",
                "limit": 50
            }
        }

class MemoryEntry(BaseModel):
    """Model representing a memory entry."""
    memory_id: str = Field(..., description="Unique identifier for the memory")
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the task")
    memory_type: str = Field(..., description="Type of memory")
    content: Dict[str, Any] = Field(..., description="Memory content")
    timestamp: str = Field(..., description="Timestamp (ISO format)")
    tags: List[str] = Field(..., description="Tags for categorization")
    
    class Config:
        schema_extra = {
            "example": {
                "memory_id": "mem-789",
                "agent_id": "agent-123",
                "task_id": "task-456",
                "memory_type": "episodic",
                "content": {
                    "action": "file_read",
                    "path": "/home/user/document.txt",
                    "result": "success"
                },
                "timestamp": "2025-05-22T03:45:12Z",
                "tags": ["file_operation", "read"]
            }
        }

class MemoryQueryResponse(BaseModel):
    """Response model for memory query operations."""
    results: List[MemoryEntry] = Field(..., description="Query results")
    count: int = Field(..., description="Number of results returned")
    total: int = Field(..., description="Total number of matching results")
    
    class Config:
        schema_extra = {
            "example": {
                "results": [
                    {
                        "memory_id": "mem-789",
                        "agent_id": "agent-123",
                        "task_id": "task-456",
                        "memory_type": "episodic",
                        "content": {
                            "action": "file_read",
                            "path": "/home/user/document.txt",
                            "result": "success"
                        },
                        "timestamp": "2025-05-22T03:45:12Z",
                        "tags": ["file_operation", "read"]
                    }
                ],
                "count": 1,
                "total": 1
            }
        }

# Create router
router = APIRouter(
    prefix="/memory",
    tags=["memory"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry
def get_schema_registry():
    """Dependency to get the schema registry."""
    # In a real implementation, this would be a singleton or service
    return SchemaRegistry()

@router.post("/log", response_model=MemoryLogResponse)
async def log_memory(
    request: MemoryLogRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Log a memory entry for an agent.
    
    This endpoint allows logging of various types of memory entries including
    episodic (event-based), semantic (knowledge-based), and procedural (action-based)
    memories. Each memory entry is associated with an agent and optionally a task.
    
    The memory content can be any valid JSON object and can be tagged for easier
    retrieval and categorization.
    """
    # In a real implementation, this would validate and store the memory
    # For now, we'll just return a mock response
    return {
        "memory_id": "mem-" + request.agent_id[-3:] + "-" + request.task_id[-3:],
        "status": "success",
        "timestamp": request.timestamp or "2025-05-22T03:45:12Z"
    }

@router.get("/query", response_model=MemoryQueryResponse)
async def query_memory(
    agent_id: str = Query(..., description="Unique identifier for the agent"),
    memory_type: Optional[str] = Query(None, description="Optional filter by memory type"),
    tags: List[str] = Query([], description="Optional filter by tags"),
    start_time: Optional[str] = Query(None, description="Optional start time filter (ISO format)"),
    end_time: Optional[str] = Query(None, description="Optional end time filter (ISO format)"),
    limit: int = Query(100, description="Maximum number of results to return"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Query memory entries for an agent.
    
    This endpoint allows querying of memory entries based on various filters
    including memory type, tags, and time range. Results are paginated and
    can be limited to a maximum number.
    """
    # In a real implementation, this would query the memory store
    # For now, we'll just return a mock response
    mock_entry = MemoryEntry(
        memory_id="mem-123-456",
        agent_id=agent_id,
        task_id="task-456",
        memory_type=memory_type or "episodic",
        content={
            "action": "file_read",
            "path": "/home/user/document.txt",
            "result": "success"
        },
        timestamp="2025-05-22T03:45:12Z",
        tags=tags or ["file_operation", "read"]
    )
    
    return {
        "results": [mock_entry],
        "count": 1,
        "total": 1
    }

@router.get("/{memory_id}", response_model=MemoryEntry)
async def get_memory(
    memory_id: str = Path(..., description="Unique identifier for the memory"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get a specific memory entry by ID.
    
    This endpoint retrieves a single memory entry by its unique identifier.
    """
    # In a real implementation, this would retrieve the memory from storage
    # For now, we'll just return a mock response
    return {
        "memory_id": memory_id,
        "agent_id": "agent-123",
        "task_id": "task-456",
        "memory_type": "episodic",
        "content": {
            "action": "file_read",
            "path": "/home/user/document.txt",
            "result": "success"
        },
        "timestamp": "2025-05-22T03:45:12Z",
        "tags": ["file_operation", "read"]
    }

@router.delete("/{memory_id}", response_model=Dict[str, str])
async def delete_memory(
    memory_id: str = Path(..., description="Unique identifier for the memory"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Delete a specific memory entry by ID.
    
    This endpoint deletes a single memory entry by its unique identifier.
    """
    # In a real implementation, this would delete the memory from storage
    # For now, we'll just return a mock response
    return {
        "status": "success",
        "message": f"Memory {memory_id} deleted successfully"
    }
