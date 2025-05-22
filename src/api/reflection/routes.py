"""
API routes for the Reflection API in Promethios.

This module defines the routes for the Reflection API, which is responsible for
generating reflections on agent actions, learning from experiences, and improving
future decision-making.
"""

from typing import Dict, List, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from pydantic import BaseModel, Field

from ..schema_validation.registry import SchemaRegistry

# Define API models
class ReflectionGenerateRequest(BaseModel):
    """Request model for generating reflections."""
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the current task")
    action_history: List[Dict[str, Any]] = Field(..., description="History of agent actions")
    outcome: Dict[str, Any] = Field(..., description="Outcome of the actions")
    context: Dict[str, Any] = Field(..., description="Contextual information for reflection")
    reflection_type: str = Field("comprehensive", description="Type of reflection to generate")
    timestamp: Optional[str] = Field(None, description="Optional timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "task_id": "task-456",
                "action_history": [
                    {
                        "action_type": "file_read",
                        "details": {"path": "/home/user/document.txt"},
                        "timestamp": "2025-05-22T03:45:10Z",
                        "result": "success"
                    },
                    {
                        "action_type": "file_write",
                        "details": {"path": "/home/user/output.txt", "content": "Processed data"},
                        "timestamp": "2025-05-22T03:45:15Z",
                        "result": "failure",
                        "error": "Permission denied"
                    }
                ],
                "outcome": {
                    "status": "failure",
                    "error_type": "permission_error",
                    "user_feedback": "Task failed due to permission issues"
                },
                "context": {
                    "user_permission_level": "standard",
                    "environment": "production",
                    "task_priority": "high"
                },
                "reflection_type": "comprehensive",
                "timestamp": "2025-05-22T03:50:20Z"
            }
        }

class ReflectionGenerateResponse(BaseModel):
    """Response model for reflection generation operations."""
    reflection_id: str = Field(..., description="Unique identifier for the reflection")
    reflections: Dict[str, Any] = Field(..., description="Generated reflections")
    learning_points: List[str] = Field(..., description="Key learning points")
    improvement_suggestions: List[str] = Field(..., description="Suggestions for improvement")
    timestamp: str = Field(..., description="Timestamp of the reflection (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "reflection_id": "ref-789",
                "reflections": {
                    "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
                    "cause": "The agent did not check for write permissions before attempting to write to the file.",
                    "impact": "The task failed, requiring user intervention and causing delay."
                },
                "learning_points": [
                    "Always check file permissions before attempting write operations",
                    "Handle permission errors gracefully with appropriate user feedback",
                    "Consider requesting elevated permissions when necessary"
                ],
                "improvement_suggestions": [
                    "Implement permission checking before file operations",
                    "Add error recovery mechanisms for permission issues",
                    "Provide clearer error messages to users"
                ],
                "timestamp": "2025-05-22T03:50:25Z"
            }
        }

class ReflectionQueryRequest(BaseModel):
    """Request model for querying reflections."""
    agent_id: Optional[str] = Field(None, description="Optional filter by agent ID")
    reflection_type: Optional[str] = Field(None, description="Optional filter by reflection type")
    start_time: Optional[str] = Field(None, description="Optional start time filter (ISO format)")
    end_time: Optional[str] = Field(None, description="Optional end time filter (ISO format)")
    limit: int = Field(100, description="Maximum number of results to return")
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "agent-123",
                "reflection_type": "comprehensive",
                "start_time": "2025-05-21T00:00:00Z",
                "end_time": "2025-05-22T23:59:59Z",
                "limit": 50
            }
        }

class Reflection(BaseModel):
    """Model representing a reflection."""
    reflection_id: str = Field(..., description="Unique identifier for the reflection")
    agent_id: str = Field(..., description="Unique identifier for the agent")
    task_id: str = Field(..., description="Identifier for the task")
    reflection_type: str = Field(..., description="Type of reflection")
    reflections: Dict[str, Any] = Field(..., description="Generated reflections")
    learning_points: List[str] = Field(..., description="Key learning points")
    improvement_suggestions: List[str] = Field(..., description="Suggestions for improvement")
    timestamp: str = Field(..., description="Timestamp (ISO format)")
    
    class Config:
        schema_extra = {
            "example": {
                "reflection_id": "ref-789",
                "agent_id": "agent-123",
                "task_id": "task-456",
                "reflection_type": "comprehensive",
                "reflections": {
                    "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
                    "cause": "The agent did not check for write permissions before attempting to write to the file.",
                    "impact": "The task failed, requiring user intervention and causing delay."
                },
                "learning_points": [
                    "Always check file permissions before attempting write operations",
                    "Handle permission errors gracefully with appropriate user feedback",
                    "Consider requesting elevated permissions when necessary"
                ],
                "improvement_suggestions": [
                    "Implement permission checking before file operations",
                    "Add error recovery mechanisms for permission issues",
                    "Provide clearer error messages to users"
                ],
                "timestamp": "2025-05-22T03:50:25Z"
            }
        }

class ReflectionQueryResponse(BaseModel):
    """Response model for reflection query operations."""
    results: List[Reflection] = Field(..., description="Query results")
    count: int = Field(..., description="Number of results returned")
    total: int = Field(..., description="Total number of matching results")
    
    class Config:
        schema_extra = {
            "example": {
                "results": [
                    {
                        "reflection_id": "ref-789",
                        "agent_id": "agent-123",
                        "task_id": "task-456",
                        "reflection_type": "comprehensive",
                        "reflections": {
                            "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
                            "cause": "The agent did not check for write permissions before attempting to write to the file.",
                            "impact": "The task failed, requiring user intervention and causing delay."
                        },
                        "learning_points": [
                            "Always check file permissions before attempting write operations",
                            "Handle permission errors gracefully with appropriate user feedback",
                            "Consider requesting elevated permissions when necessary"
                        ],
                        "improvement_suggestions": [
                            "Implement permission checking before file operations",
                            "Add error recovery mechanisms for permission issues",
                            "Provide clearer error messages to users"
                        ],
                        "timestamp": "2025-05-22T03:50:25Z"
                    }
                ],
                "count": 1,
                "total": 1
            }
        }

# Create router
router = APIRouter(
    prefix="/reflection",
    tags=["reflection"],
    responses={404: {"description": "Not found"}},
)

# Dependency for schema registry
def get_schema_registry():
    """Dependency to get the schema registry."""
    # In a real implementation, this would be a singleton or service
    return SchemaRegistry()

@router.post("/generate", response_model=ReflectionGenerateResponse)
async def generate_reflection(
    request: ReflectionGenerateRequest,
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Generate reflections on agent actions and outcomes.
    
    This endpoint analyzes the agent's action history and outcomes to generate
    reflections, identify learning points, and suggest improvements for future
    actions. Different reflection types can be requested, from focused to
    comprehensive.
    
    The reflections help agents learn from experience and improve their
    decision-making over time.
    """
    # In a real implementation, this would analyze actions and generate reflections
    # For now, we'll just return a mock response
    
    # Simple mock logic for demonstration
    reflections = {
        "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
        "cause": "The agent did not check for write permissions before attempting to write to the file.",
        "impact": "The task failed, requiring user intervention and causing delay."
    }
    
    learning_points = [
        "Always check file permissions before attempting write operations",
        "Handle permission errors gracefully with appropriate user feedback",
        "Consider requesting elevated permissions when necessary"
    ]
    
    improvement_suggestions = [
        "Implement permission checking before file operations",
        "Add error recovery mechanisms for permission issues",
        "Provide clearer error messages to users"
    ]
    
    return {
        "reflection_id": f"ref-{request.agent_id[-3:]}-{request.task_id[-3:]}",
        "reflections": reflections,
        "learning_points": learning_points,
        "improvement_suggestions": improvement_suggestions,
        "timestamp": request.timestamp or "2025-05-22T03:50:25Z"
    }

@router.get("/query", response_model=ReflectionQueryResponse)
async def query_reflections(
    agent_id: Optional[str] = Query(None, description="Optional filter by agent ID"),
    reflection_type: Optional[str] = Query(None, description="Optional filter by reflection type"),
    start_time: Optional[str] = Query(None, description="Optional start time filter (ISO format)"),
    end_time: Optional[str] = Query(None, description="Optional end time filter (ISO format)"),
    limit: int = Query(100, description="Maximum number of results to return"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Query reflections.
    
    This endpoint allows querying of reflections based on various filters
    including agent ID, reflection type, and time range. Results are paginated
    and can be limited to a maximum number.
    """
    # In a real implementation, this would query the reflection store
    # For now, we'll just return a mock response
    mock_reflection = Reflection(
        reflection_id="ref-123-456",
        agent_id=agent_id or "agent-123",
        task_id="task-456",
        reflection_type=reflection_type or "comprehensive",
        reflections={
            "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
            "cause": "The agent did not check for write permissions before attempting to write to the file.",
            "impact": "The task failed, requiring user intervention and causing delay."
        },
        learning_points=[
            "Always check file permissions before attempting write operations",
            "Handle permission errors gracefully with appropriate user feedback",
            "Consider requesting elevated permissions when necessary"
        ],
        improvement_suggestions=[
            "Implement permission checking before file operations",
            "Add error recovery mechanisms for permission issues",
            "Provide clearer error messages to users"
        ],
        timestamp="2025-05-22T03:50:25Z"
    )
    
    return {
        "results": [mock_reflection],
        "count": 1,
        "total": 1
    }

@router.get("/{reflection_id}", response_model=Reflection)
async def get_reflection(
    reflection_id: str = Path(..., description="Unique identifier for the reflection"),
    schema_registry: SchemaRegistry = Depends(get_schema_registry)
):
    """
    Get a specific reflection by ID.
    
    This endpoint retrieves a single reflection by its unique identifier.
    """
    # In a real implementation, this would retrieve the reflection from storage
    # For now, we'll just return a mock response
    return {
        "reflection_id": reflection_id,
        "agent_id": "agent-123",
        "task_id": "task-456",
        "reflection_type": "comprehensive",
        "reflections": {
            "process": "The agent attempted to read a file and then write to another file, but encountered a permission error during the write operation.",
            "cause": "The agent did not check for write permissions before attempting to write to the file.",
            "impact": "The task failed, requiring user intervention and causing delay."
        },
        "learning_points": [
            "Always check file permissions before attempting write operations",
            "Handle permission errors gracefully with appropriate user feedback",
            "Consider requesting elevated permissions when necessary"
        ],
        "improvement_suggestions": [
            "Implement permission checking before file operations",
            "Add error recovery mechanisms for permission issues",
            "Provide clearer error messages to users"
        ],
        "timestamp": "2025-05-22T03:50:25Z"
    }
