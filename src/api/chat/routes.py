"""
Chat API routes for the Promethios Chat Backend.

This module implements Phase 1 of the Chat Backend Strategic Architecture,
providing core chat infrastructure with governance integration.

Features:
- Chat session management with governance metadata
- Message processing pipeline with policy enforcement
- Real-time governance integration
- Multi-agent conversation support
- Trust scoring and audit logging
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field
import subprocess
import asyncio

# Import other Promethios modules for integration
from ..policy.routes import call_policy_management
# Import AI model service and multi-agent coordinator
from .ai_model_service import ai_model_service
from .multi_agent_coordinator import MultiAgentCoordinator, CoordinationPattern

# Temporarily use mock functions for trust and audit until Phase 2
# from ..trust.routes import call_trust_system
# from ..audit.routes import call_audit_system

def call_trust_system(method: str, *args) -> dict:
    """Mock trust system for Phase 1 - will be replaced with real integration in Phase 2"""
    if method == "assessMessageTrust":
        return {"trust_score": 0.8, "status": "success"}
    return {"status": "success", "trust_score": 0.8}

def call_audit_system(method: str, *args) -> dict:
    """Mock audit system for Phase 1 - will be replaced with real integration in Phase 2"""
    return {"status": "success", "logged": True}

# Initialize multi-agent coordinator
multi_agent_coordinator = MultiAgentCoordinator(ai_model_service)

router = APIRouter(prefix="/chat", tags=["chat"])

# ============================================================================
# Data Models for Chat System
# ============================================================================

class ChatMessage(BaseModel):
    """Individual message in a chat conversation."""
    message_id: str = Field(..., description="Unique message identifier")
    session_id: str = Field(..., description="Chat session identifier")
    role: str = Field(..., description="Message role: user, assistant, system, agent")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    agent_id: Optional[str] = Field(None, description="Agent that generated this message")
    governance_metadata: Optional[Dict[str, Any]] = Field(None, description="Governance evaluation data")
    trust_score: Optional[float] = Field(None, description="Trust score for this message")
    policy_results: Optional[List[Dict[str, Any]]] = Field(None, description="Policy evaluation results")

class GovernanceConfig(BaseModel):
    """Governance configuration for a chat session."""
    enabled: bool = Field(True, description="Whether governance is enabled")
    policy_enforcement_level: str = Field("moderate", description="Policy enforcement level: strict, moderate, lenient")
    trust_threshold: float = Field(0.7, description="Minimum trust score threshold")
    observer_monitoring: bool = Field(True, description="Whether observer agent monitoring is enabled")
    audit_logging: bool = Field(True, description="Whether audit logging is enabled")
    real_time_validation: bool = Field(True, description="Whether real-time policy validation is enabled")

class AgentConfig(BaseModel):
    """Configuration for single agent chat."""
    agent_id: str = Field(..., description="Agent identifier")
    agent_type: str = Field("single", description="Agent type")
    model_provider: Optional[str] = Field(None, description="AI model provider")
    model_name: Optional[str] = Field(None, description="AI model name")
    capabilities: List[str] = Field(default_factory=list, description="Agent capabilities")
    governance_policies: List[str] = Field(default_factory=list, description="Applied governance policies")

class MultiAgentConfig(BaseModel):
    """Configuration for multi-agent chat."""
    coordination_pattern: str = Field("sequential", description="Coordination pattern: sequential, parallel, hierarchical, collaborative")
    agents: List[AgentConfig] = Field(..., description="List of agents in the multi-agent system")
    lead_agent_id: Optional[str] = Field(None, description="Lead agent for hierarchical coordination")
    consensus_threshold: float = Field(0.8, description="Consensus threshold for collaborative decisions")
    max_rounds: int = Field(5, description="Maximum coordination rounds")

class ChatSession(BaseModel):
    """Chat session with governance integration."""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User identifier")
    session_type: str = Field("single_agent", description="Session type: single_agent, multi_agent")
    governance_config: GovernanceConfig = Field(default_factory=GovernanceConfig)
    agent_config: Optional[AgentConfig] = Field(None, description="Single agent configuration")
    multi_agent_config: Optional[MultiAgentConfig] = Field(None, description="Multi-agent configuration")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_count: int = Field(0, description="Number of messages in session")
    trust_metrics: Dict[str, float] = Field(default_factory=dict, description="Session trust metrics")
    governance_summary: Dict[str, Any] = Field(default_factory=dict, description="Session governance summary")

class MessageRequest(BaseModel):
    """Request to send a message in a chat session."""
    content: str = Field(..., description="Message content")
    attachments: Optional[List[Dict[str, Any]]] = Field(None, description="Message attachments")
    governance_override: Optional[Dict[str, Any]] = Field(None, description="Governance override settings")

class MessageResponse(BaseModel):
    """Response from sending a message."""
    message_id: str = Field(..., description="Generated message ID")
    session_id: str = Field(..., description="Chat session ID")
    response_content: str = Field(..., description="AI response content")
    governance_status: str = Field(..., description="Governance evaluation status")
    trust_score: float = Field(..., description="Response trust score")
    policy_compliance: bool = Field(..., description="Whether response complies with policies")
    observer_notes: Optional[str] = Field(None, description="Observer agent notes")
    processing_time_ms: int = Field(..., description="Response processing time in milliseconds")

# ============================================================================
# In-Memory Storage (Phase 1 - will be replaced with database in Phase 2)
# ============================================================================

# Session storage
active_sessions: Dict[str, ChatSession] = {}
session_messages: Dict[str, List[ChatMessage]] = {}

# ============================================================================
# Core Chat Infrastructure Functions
# ============================================================================

def call_governance_orchestrator(method: str, *args) -> dict:
    """
    Call the Governance Orchestrator for chat-specific governance operations.
    
    This integrates with the existing policy, trust, and audit systems to provide
    comprehensive governance for chat interactions.
    """
    try:
        # For Phase 1, we'll integrate with existing systems
        # In Phase 2, this will be a dedicated governance orchestrator
        
        if method == "evaluate_message":
            message_content, governance_config = args
            
            # Get policy evaluation
            policy_result = call_policy_management("evaluateMessage", {
                "content": message_content,
                "enforcement_level": governance_config.policy_enforcement_level,
                "real_time": governance_config.real_time_validation
            })
            
            # Get trust assessment
            trust_result = call_trust_system("assessMessageTrust", {
                "content": message_content,
                "threshold": governance_config.trust_threshold
            })
            
            # Combine results
            return {
                "status": "success",
                "policy_compliance": policy_result.get("compliant", True),
                "trust_score": trust_result.get("trust_score", 0.8),
                "governance_status": "compliant" if policy_result.get("compliant", True) else "violation",
                "details": {
                    "policy_results": policy_result,
                    "trust_results": trust_result
                }
            }
            
        elif method == "validate_response":
            response_content, governance_config = args
            
            # Validate AI response against policies
            policy_result = call_policy_management("validateResponse", {
                "content": response_content,
                "enforcement_level": governance_config.policy_enforcement_level
            })
            
            return {
                "status": "success",
                "valid": policy_result.get("compliant", True),
                "governance_status": "approved" if policy_result.get("compliant", True) else "rejected",
                "policy_results": policy_result
            }
            
        else:
            return {"status": "error", "error": f"Unknown governance method: {method}"}
            
    except Exception as e:
        return {"status": "error", "error": str(e)}

async def call_agent_system(method: str, *args) -> dict:
    """
    Call the Agent System for AI model interactions with real AI integration.
    
    This integrates with the AI model service to route messages
    to appropriate AI models with governance oversight.
    """
    try:
        if method == "generate_response":
            agent_config, message_content, governance_config = args
            
            # Convert conversation history if available
            conversation_history = []
            
            # Build governance context
            governance_context = {
                "enabled": governance_config.enabled,
                "policy_enforcement_level": governance_config.policy_enforcement_level,
                "trust_threshold": governance_config.trust_threshold,
                "observer_monitoring": governance_config.observer_monitoring
            }
            
            # Generate response using AI model service (properly async)
            response_data = await ai_model_service.generate_response(
                agent_config.agent_id,
                message_content,
                conversation_history,
                governance_context
            )
            
            # Log the response for debugging
            print(f"AI Model Response: {response_data}")
            
            if response_data.get("status") == "error":
                print(f"AI Model Error Details: {response_data.get('error_details', {})}")
            
            return {
                "status": response_data.get("status", "success"),
                "response": response_data.get("response", ""),
                "agent_id": agent_config.agent_id,
                "processing_time_ms": response_data.get("processing_time_ms", 0),
                "model": response_data.get("model", "unknown"),
                "provider": response_data.get("provider", "unknown"),
                "error_details": response_data.get("error_details")
            }
            
        elif method == "coordinate_multi_agent":
            multi_agent_config, message_content, governance_config = args
            
            # Convert agent configs to format expected by coordinator
            agents = []
            for agent_config in multi_agent_config.agents:
                agents.append({
                    "agent_id": agent_config.agent_id,
                    "agent_type": agent_config.agent_type,
                    "capabilities": agent_config.capabilities,
                    "governance_policies": agent_config.governance_policies
                })
            
            # Build governance context
            governance_context = {
                "enabled": governance_config.enabled,
                "policy_enforcement_level": governance_config.policy_enforcement_level,
                "trust_threshold": governance_config.trust_threshold,
                "observer_monitoring": governance_config.observer_monitoring
            }
            
            # Coordination configuration
            coordination_config = {
                "max_rounds": multi_agent_config.max_rounds,
                "consensus_threshold": multi_agent_config.consensus_threshold,
                "lead_agent_id": multi_agent_config.lead_agent_id
            }
            
            # Coordinate agents (properly async)
            coordination_result = await multi_agent_coordinator.coordinate_agents(
                agents,
                message_content,
                CoordinationPattern(multi_agent_config.coordination_pattern),
                [],  # conversation_history
                governance_context,
                coordination_config
            )
            
            return {
                "status": "success",
                "response": coordination_result.final_response,
                "coordination_pattern": coordination_result.coordination_pattern.value,
                "participating_agents": coordination_result.participating_agents,
                "consensus_score": coordination_result.consensus_score,
                "processing_time_ms": coordination_result.total_processing_time_ms,
                "individual_responses": [
                    {
                        "agent_id": r.agent_id,
                        "content": r.content,
                        "confidence": r.confidence,
                        "trust_score": r.trust_score
                    }
                    for r in coordination_result.individual_responses
                ]
            }
            
        else:
            return {"status": "error", "error": f"Unknown agent method: {method}"}
            
    except Exception as e:
        print(f"Agent System Exception: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"Agent System Traceback: {traceback.format_exc()}")
        return {
            "status": "error", 
            "error": str(e),
            "error_type": type(e).__name__,
            "error_details": {
                "method": method,
                "args_count": len(args),
                "traceback": traceback.format_exc()
            }
        }

def call_observer_agent(method: str, *args) -> dict:
    """
    Call the Observer Agent for governance monitoring and intervention.
    """
    try:
        if method == "monitor_conversation":
            session_id, message, response, governance_results = args
            
            # Simulate observer monitoring
            risk_level = "low"
            intervention_needed = False
            
            # Check for governance violations
            if governance_results.get("governance_status") == "violation":
                risk_level = "high"
                intervention_needed = True
            
            # Check trust score
            trust_score = governance_results.get("trust_score", 1.0)
            if trust_score < 0.5:
                risk_level = "medium"
                intervention_needed = True
            
            observer_notes = None
            if intervention_needed:
                observer_notes = f"Observer intervention: {risk_level} risk detected. Trust score: {trust_score}"
            
            return {
                "status": "success",
                "risk_level": risk_level,
                "intervention_needed": intervention_needed,
                "observer_notes": observer_notes,
                "monitoring_timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        else:
            return {"status": "error", "error": f"Unknown observer method: {method}"}
            
    except Exception as e:
        return {"status": "error", "error": str(e)}

# ============================================================================
# Chat API Endpoints
# ============================================================================

@router.post("/sessions", response_model=ChatSession)
async def create_chat_session(
    user_id: str = Query(..., description="User identifier"),
    session_type: str = Query("single_agent", description="Session type: single_agent, multi_agent"),
    governance_enabled: bool = Query(True, description="Enable governance for this session"),
    agent_id: Optional[str] = Query(None, description="Agent ID for single agent sessions")
):
    """
    Create a new chat session with governance configuration.
    
    This is the entry point for all chat interactions in Promethios.
    """
    try:
        session_id = str(uuid.uuid4())
        
        # Create governance configuration
        governance_config = GovernanceConfig(
            enabled=governance_enabled,
            policy_enforcement_level="moderate",
            trust_threshold=0.7,
            observer_monitoring=True,
            audit_logging=True,
            real_time_validation=True
        )
        
        # Create agent configuration if specified
        agent_config = None
        multi_agent_config = None
        
        if session_type == "single_agent" and agent_id:
            agent_config = AgentConfig(
                agent_id=agent_id,
                agent_type="single",
                capabilities=["text-generation", "conversation"],
                governance_policies=["content-policy", "safety-policy"]
            )
        elif session_type == "multi_agent":
            # Default multi-agent configuration
            multi_agent_config = MultiAgentConfig(
                coordination_pattern="sequential",
                agents=[
                    AgentConfig(agent_id="factual-agent", agent_type="specialist"),
                    AgentConfig(agent_id="creative-agent", agent_type="specialist")
                ]
            )
        
        # Create session
        session = ChatSession(
            session_id=session_id,
            user_id=user_id,
            session_type=session_type,
            governance_config=governance_config,
            agent_config=agent_config,
            multi_agent_config=multi_agent_config
        )
        
        # Store session
        active_sessions[session_id] = session
        session_messages[session_id] = []
        
        # Log session creation for audit
        if governance_config.audit_logging:
            call_audit_system("logEvent", {
                "event_type": "chat_session_created",
                "session_id": session_id,
                "user_id": user_id,
                "governance_enabled": governance_enabled,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        
        return session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat session: {str(e)}")

@router.get("/sessions/{session_id}", response_model=ChatSession)
async def get_chat_session(session_id: str = Path(..., description="Chat session ID")):
    """Get details of a specific chat session."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return active_sessions[session_id]

@router.post("/sessions/{session_id}/messages", response_model=MessageResponse)
async def send_message(
    session_id: str = Path(..., description="Chat session ID"),
    message_request: MessageRequest = ...,
    background_tasks: BackgroundTasks = ...
):
    """
    Send a message in a chat session with full governance pipeline processing.
    
    This implements the core message processing pipeline from the strategic architecture.
    """
    start_time = datetime.now()
    
    try:
        # Validate session exists
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        session = active_sessions[session_id]
        
        # Generate message ID
        message_id = str(uuid.uuid4())
        
        # Stage 1: Input Validation
        if not message_request.content.strip():
            raise HTTPException(status_code=400, detail="Message content cannot be empty")
        
        # Stage 2: Governance Pre-Check
        governance_results = {"governance_status": "compliant", "trust_score": 0.8}
        if session.governance_config.enabled:
            governance_results = call_governance_orchestrator(
                "evaluate_message", 
                message_request.content, 
                session.governance_config
            )
            
            # Block message if governance violation
            if governance_results.get("governance_status") == "violation":
                raise HTTPException(
                    status_code=403, 
                    detail="Message violates governance policies"
                )
        
        # Stage 3: Create user message
        user_message = ChatMessage(
            message_id=message_id,
            session_id=session_id,
            role="user",
            content=message_request.content,
            governance_metadata=governance_results,
            trust_score=governance_results.get("trust_score")
        )
        
        # Stage 4: Agent Routing and Response Generation
        if session.session_type == "single_agent" and session.agent_config:
            agent_response = await call_agent_system(
                "generate_response",
                session.agent_config,
                message_request.content,
                session.governance_config
            )
        elif session.session_type == "multi_agent" and session.multi_agent_config:
            agent_response = await call_agent_system(
                "coordinate_multi_agent",
                session.multi_agent_config,
                message_request.content,
                session.governance_config
            )
        else:
            # Fallback to default response
            agent_response = {
                "status": "success",
                "response": f"Echo: {message_request.content}",
                "processing_time_ms": 500
            }
        
        # Log agent response for debugging
        print(f"Agent Response in Route Handler: {agent_response}")
        
        # Check for agent system errors
        if agent_response.get("status") == "error":
            error_msg = agent_response.get("error", "Unknown agent system error")
            print(f"Agent System Error in Route: {error_msg}")
            print(f"Error Details: {agent_response.get('error_details', {})}")
            
            # Return error response instead of masking it
            return MessageResponse(
                message_id=message_id,
                session_id=session_id,
                response_content=f"Agent Error: {error_msg}",
                governance_status="error",
                trust_score=0.0,
                policy_compliance=False,
                observer_notes=f"Agent system error: {error_msg}",
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000)
            )
        
        # Ensure agent_response has required fields
        if "response" not in agent_response:
            agent_response["response"] = "I apologize, but I encountered an issue generating a response."
        if "processing_time_ms" not in agent_response:
            agent_response["processing_time_ms"] = 1000
        
        # Stage 5: Response Governance Validation
        response_validation = {"valid": True, "governance_status": "approved"}
        if session.governance_config.enabled:
            response_validation = call_governance_orchestrator(
                "validate_response",
                agent_response["response"],
                session.governance_config
            )
            
            # Modify response if governance issues
            if not response_validation.get("valid", True):
                agent_response["response"] = "I apologize, but I cannot provide that response due to governance policies. Please try rephrasing your request."
        
        # Stage 6: Observer Evaluation
        observer_results = {"intervention_needed": False}
        if session.governance_config.observer_monitoring:
            observer_results = call_observer_agent(
                "monitor_conversation",
                session_id,
                user_message.content,
                agent_response["response"],
                governance_results
            )
        
        # Stage 7: Create assistant message
        assistant_message_id = str(uuid.uuid4())
        assistant_message = ChatMessage(
            message_id=assistant_message_id,
            session_id=session_id,
            role="assistant",
            content=agent_response["response"],
            agent_id=session.agent_config.agent_id if session.agent_config else "system",
            governance_metadata=response_validation,
            trust_score=governance_results.get("trust_score", 0.8)
        )
        
        # Stage 8: Store messages and update session
        session_messages[session_id].extend([user_message, assistant_message])
        session.message_count += 2
        session.last_activity = datetime.now(timezone.utc)
        
        # Update trust metrics
        session.trust_metrics["last_trust_score"] = governance_results.get("trust_score", 0.8)
        session.trust_metrics["average_trust_score"] = sum(
            msg.trust_score for msg in session_messages[session_id] if msg.trust_score
        ) / len([msg for msg in session_messages[session_id] if msg.trust_score])
        
        # Background task: Audit logging
        if session.governance_config.audit_logging:
            background_tasks.add_task(
                call_audit_system,
                "logConversation",
                {
                    "session_id": session_id,
                    "user_message": user_message.dict(),
                    "assistant_message": assistant_message.dict(),
                    "governance_results": governance_results,
                    "observer_results": observer_results,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        # Return response
        return MessageResponse(
            message_id=assistant_message_id,
            session_id=session_id,
            response_content=agent_response["response"],
            governance_status=governance_results.get("governance_status", "compliant"),
            trust_score=governance_results.get("trust_score", 0.8),
            policy_compliance=response_validation.get("valid", True),
            observer_notes=observer_results.get("observer_notes"),
            processing_time_ms=int(processing_time)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process message: {str(e)}")

@router.get("/sessions/{session_id}/messages")
async def get_conversation_history(
    session_id: str = Path(..., description="Chat session ID"),
    limit: int = Query(50, description="Maximum number of messages to return"),
    offset: int = Query(0, description="Number of messages to skip")
):
    """Get conversation history for a chat session."""
    if session_id not in session_messages:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    messages = session_messages[session_id]
    total_messages = len(messages)
    
    # Apply pagination
    paginated_messages = messages[offset:offset + limit]
    
    return {
        "session_id": session_id,
        "messages": [msg.dict() for msg in paginated_messages],
        "total_messages": total_messages,
        "offset": offset,
        "limit": limit
    }

@router.get("/sessions/{session_id}/governance")
async def get_governance_status(session_id: str = Path(..., description="Chat session ID")):
    """Get current governance status for a chat session."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    session = active_sessions[session_id]
    messages = session_messages.get(session_id, [])
    
    # Calculate governance metrics
    total_messages = len(messages)
    compliant_messages = len([msg for msg in messages if msg.governance_metadata and msg.governance_metadata.get("governance_status") == "compliant"])
    compliance_rate = compliant_messages / total_messages if total_messages > 0 else 1.0
    
    # Calculate average trust score
    trust_scores = [msg.trust_score for msg in messages if msg.trust_score is not None]
    average_trust_score = sum(trust_scores) / len(trust_scores) if trust_scores else 0.8
    
    return {
        "session_id": session_id,
        "governance_enabled": session.governance_config.enabled,
        "compliance_rate": compliance_rate,
        "average_trust_score": average_trust_score,
        "total_messages": total_messages,
        "policy_violations": total_messages - compliant_messages,
        "governance_config": session.governance_config.dict(),
        "last_updated": session.last_activity.isoformat()
    }

@router.get("/sessions")
async def list_chat_sessions(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(20, description="Maximum number of sessions to return"),
    offset: int = Query(0, description="Number of sessions to skip")
):
    """List chat sessions with optional filtering."""
    sessions = list(active_sessions.values())
    
    # Filter by user_id if provided
    if user_id:
        sessions = [s for s in sessions if s.user_id == user_id]
    
    # Sort by last activity (most recent first)
    sessions.sort(key=lambda s: s.last_activity, reverse=True)
    
    # Apply pagination
    total_sessions = len(sessions)
    paginated_sessions = sessions[offset:offset + limit]
    
    return {
        "sessions": [session.dict() for session in paginated_sessions],
        "total_sessions": total_sessions,
        "offset": offset,
        "limit": limit
    }

@router.delete("/sessions/{session_id}")
async def delete_chat_session(session_id: str = Path(..., description="Chat session ID")):
    """Delete a chat session and its messages."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Remove session and messages
    del active_sessions[session_id]
    if session_id in session_messages:
        del session_messages[session_id]
    
    # Log deletion for audit
    call_audit_system("logEvent", {
        "event_type": "chat_session_deleted",
        "session_id": session_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Chat session deleted successfully"}

# ============================================================================
# Health and Status Endpoints
# ============================================================================

@router.get("/debug/test-ai")
async def debug_test_ai():
    """Test AI model service directly."""
    try:
        response = await ai_model_service.generate_response(
            "baseline-agent",
            "Hello, this is a test message",
            [],
            {"enabled": True, "policy_enforcement_level": "moderate"}
        )
        return {"status": "success", "ai_response": response}
    except Exception as e:
        import traceback
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        }

@router.get("/debug/env-check")
async def debug_env_check():
    """Debug endpoint to check environment variable access."""
    import os
    
    env_status = {
        "openai_key_present": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic_key_present": bool(os.getenv("ANTHROPIC_API_KEY")),
        "cohere_key_present": bool(os.getenv("COHERE_API_KEY")),
        "huggingface_key_present": bool(os.getenv("HUGGINGFACE_API_KEY")),
        "openai_key_length": len(os.getenv("OPENAI_API_KEY", "")),
        "anthropic_key_length": len(os.getenv("ANTHROPIC_API_KEY", "")),
    }
    
    return {
        "status": "debug",
        "environment_access": env_status,
        "ai_model_service_config": {
            "openai_configured": ai_model_service.config.openai_api_key is not None,
            "anthropic_configured": ai_model_service.config.anthropic_api_key is not None,
            "cohere_configured": ai_model_service.config.cohere_api_key is not None,
        }
    }

@router.get("/health")
async def chat_system_health():
    """Get health status of the chat system and its integrations."""
    try:
        # Test governance system
        governance_health = call_governance_orchestrator("evaluate_message", "test", GovernanceConfig())
        governance_status = "healthy" if governance_health.get("status") == "success" else "unhealthy"
        
        # Test agent system
        agent_health = call_agent_system("generate_response", 
            AgentConfig(agent_id="test-agent"), "test", GovernanceConfig())
        agent_status = "healthy" if agent_health.get("status") == "success" else "unhealthy"
        
        # Test observer system
        observer_health = call_observer_agent("monitor_conversation", "test", "test", "test", {})
        observer_status = "healthy" if observer_health.get("status") == "success" else "unhealthy"
        
        overall_status = "healthy" if all([
            governance_status == "healthy",
            agent_status == "healthy", 
            observer_status == "healthy"
        ]) else "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "components": {
                "governance_system": governance_status,
                "agent_system": agent_status,
                "observer_system": observer_status
            },
            "active_sessions": len(active_sessions),
            "total_messages": sum(len(messages) for messages in session_messages.values())
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

