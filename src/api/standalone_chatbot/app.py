"""
Promethios Standalone Chatbot API
Simple FastAPI application for deployment testing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json

# Create FastAPI app
app = FastAPI(
    title="Promethios Standalone Chatbot API",
    description="Governed AI chatbot API for standalone deployment",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "").split(",")
if cors_origins and cors_origins[0]:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Request/Response models
class ChatRequest(BaseModel):
    message: str
    chatbot_id: str = "demo"

class ChatResponse(BaseModel):
    response: str
    chatbot_id: str
    governance_applied: bool = True

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "api_version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Promethios Standalone Chatbot API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Demo chat endpoint
@app.post("/api/v1/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Simple demo chat endpoint"""
    try:
        # Simple demo response
        demo_response = f"Hello! You said: '{request.message}'. This is a demo response from the Promethios governed chatbot."
        
        return ChatResponse(
            response=demo_response,
            chatbot_id=request.chatbot_id,
            governance_applied=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chatbot info endpoint
@app.get("/api/v1/chatbot/{chatbot_id}")
async def get_chatbot_info(chatbot_id: str):
    """Get chatbot information"""
    return {
        "id": chatbot_id,
        "name": "Demo Chatbot",
        "status": "active",
        "governance_enabled": True,
        "created_at": "2025-07-31T12:00:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

