#!/usr/bin/env python3
"""
Simple mock API server for testing the ChatPanelGovernanceService
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import uvicorn
import time
import random
from typing import List, Dict, Any

app = FastAPI(title="Mock Promethios API", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class TrustUpdateRequest(BaseModel):
    agent_id: str
    event_type: str
    event_data: Dict[str, Any]
    timestamp: str

class PolicyEnforceRequest(BaseModel):
    agent_id: str
    content: str
    context: Dict[str, Any]
    timestamp: str

class AuditLogRequest(BaseModel):
    interaction_id: str
    agent_id: str
    user_id: str
    interaction_type: str
    timestamp: str
    trust_score: float = None
    governance_status: str = None

class ChatMessageRequest(BaseModel):
    message: str
    agent_id: str
    context: Dict[str, Any]
    timestamp: str

# Mock responses
MOCK_RESPONSES = [
    "I'd be happy to help you with that! Based on your question, I can provide detailed information about our AI governance capabilities and how they ensure secure, compliant interactions.",
    "That's an excellent question! Our platform uses advanced trust scoring and policy enforcement to maintain the highest standards of AI safety and reliability.",
    "I understand you're looking for information about that topic. Let me provide you with a comprehensive overview of how our governance system works to protect and optimize AI interactions.",
    "Great question! Our AI agents are designed with multi-layered governance controls that monitor, evaluate, and ensure every interaction meets enterprise-grade security and compliance standards.",
    "I can definitely assist you with that. Our governance framework includes real-time trust evaluation, policy enforcement, and comprehensive audit trails for complete transparency."
]

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "mock-promethios-api", "timestamp": time.time()}

@app.get("/api/trust/query")
async def query_trust(agent_id: str):
    """Query trust score for an agent"""
    base_score = 0.75 + (random.random() * 0.2)  # 75-95%
    return {
        "currentScore": round(base_score, 3),
        "lastUpdated": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "factors": [
            {"type": "interaction_quality", "value": 0.9, "weight": 0.3},
            {"type": "policy_compliance", "value": 0.95, "weight": 0.4},
            {"type": "response_accuracy", "value": 0.85, "weight": 0.3}
        ]
    }

@app.post("/api/trust/update")
async def update_trust(request: TrustUpdateRequest):
    """Update trust score based on interaction"""
    return {
        "success": True,
        "newScore": round(0.75 + (random.random() * 0.2), 3),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

@app.post("/api/policy/enforce")
async def enforce_policy(request: PolicyEnforceRequest):
    """Enforce policies on content"""
    # Simulate policy violations for certain keywords
    violations = []
    warnings = []
    
    content_lower = request.content.lower()
    if "hack" in content_lower or "exploit" in content_lower:
        violations.append("Security-related content detected")
    if "password" in content_lower:
        warnings.append("Sensitive information reference detected")
    
    allowed = len(violations) == 0
    compliance_score = 1.0 if allowed else 0.3
    
    return {
        "allowed": allowed,
        "violations": violations,
        "warnings": warnings,
        "complianceScore": compliance_score
    }

@app.post("/api/audit/log")
async def log_audit(request: AuditLogRequest):
    """Log audit entry"""
    return {
        "id": f"audit_{int(time.time())}_{random.randint(1000, 9999)}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "success"
    }

@app.post("/api/chat/sessions/{session_id}/messages")
async def chat_message(session_id: str, request: ChatMessageRequest):
    """Generate chat response with governance"""
    # Simulate processing time
    await asyncio.sleep(0.5)
    
    # Select a realistic response
    response_text = random.choice(MOCK_RESPONSES)
    
    # Calculate trust score based on content
    trust_score = 0.85 + (random.random() * 0.1)  # 85-95%
    
    # Determine governance status
    governance_status = "approved"
    if "hack" in request.message.lower() or "exploit" in request.message.lower():
        governance_status = "flagged"
        trust_score *= 0.7
    
    return {
        "response": response_text,
        "trustScore": round(trust_score, 3),
        "governanceStatus": governance_status,
        "metadata": {
            "processingTime": "0.5s",
            "model": "governance-enabled-ai",
            "sessionId": session_id
        }
    }

if __name__ == "__main__":
    print("🚀 Starting Mock Promethios API Server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
