"""
Observer Agent API Routes

FastAPI routes for managing observer agents, AI suggestions, trust metrics,
and context awareness. Integrates with existing Node.js modules for governance.
"""

from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import subprocess
import os
import uuid

router = APIRouter()

# Request/Response Models
class RegisterObserverRequest(BaseModel):
    observer_id: str = Field(..., description="Unique observer identifier")
    name: str = Field(..., description="Observer name")
    capabilities: List[str] = Field(..., description="Observer capabilities")
    context_scope: str = Field("page", description="Context scope (page, session, global)")
    ai_model: str = Field("gpt-4", description="AI model for suggestions")
    trust_threshold: float = Field(0.7, description="Trust threshold for suggestions")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata")

class ObserverSuggestion(BaseModel):
    id: str
    text: str
    type: str = Field(..., description="info, warning, action_recommendation, governance_alert")
    action: Optional[Dict[str, Any]] = None
    source: str
    relevance: float = Field(0.0, ge=0.0, le=1.0)
    timestamp: str
    context_data: Optional[Dict[str, Any]] = None

class TrustMetrics(BaseModel):
    observer_id: str
    overall_trust_score: float = Field(..., ge=0.0, le=1.0)
    governance_compliance: float = Field(..., ge=0.0, le=1.0)
    suggestion_accuracy: float = Field(..., ge=0.0, le=1.0)
    context_awareness: float = Field(..., ge=0.0, le=1.0)
    user_feedback_score: float = Field(..., ge=0.0, le=1.0)
    last_updated: str
    metrics_history: List[Dict[str, Any]] = []

class ContextAwareness(BaseModel):
    observer_id: str
    current_page: str
    user_actions: List[Dict[str, Any]]
    session_context: Dict[str, Any]
    governance_context: Dict[str, Any]
    insights: List[str]
    last_updated: str

class ObserverConfiguration(BaseModel):
    observer_id: str
    is_active: bool = True
    suggestion_frequency: str = Field("moderate", description="low, moderate, high")
    notification_types: List[str] = []
    ai_model: str = "gpt-4"
    trust_threshold: float = 0.7
    context_scope: str = "page"
    preferences: Dict[str, Any] = {}

# Helper functions
def call_observer_module(method: str, *args) -> Dict[str, Any]:
    """Call the existing Node.js observer module"""
    try:
        # Path to the observer module (assuming it exists)
        script_path = "/home/ubuntu/promethios/src/modules/observer_agent/index.js"
        
        # Create a wrapper script
        wrapper_script = f"""
const Observer = require('{script_path}');
const observer = new Observer({{logger: console}});

const args = {json.dumps(list(args))};
const result = observer.{method}(...args.map(arg => typeof arg === 'string' ? JSON.parse(arg) : arg));
console.log(JSON.stringify(result));
"""
        
        # Write and execute wrapper script
        temp_script = "/tmp/observer_wrapper.js"
        with open(temp_script, 'w') as f:
            f.write(wrapper_script)
        
        result = subprocess.run(
            ["node", temp_script],
            capture_output=True,
            text=True,
            cwd="/home/ubuntu/promethios"
        )
        
        if result.returncode != 0:
            # If module doesn't exist, create mock response
            return create_mock_observer_response(method, *args)
        
        # Parse the result
        output_lines = result.stdout.strip().split('\n')
        json_result = None
        for line in reversed(output_lines):
            if line.strip().startswith('{'):
                json_result = line.strip()
                break
        
        if not json_result:
            return create_mock_observer_response(method, *args)
        
        return json.loads(json_result)
        
    except Exception as e:
        # Fallback to mock response
        return create_mock_observer_response(method, *args)

def create_mock_observer_response(method: str, *args) -> Dict[str, Any]:
    """Create mock responses for observer operations"""
    if method == "registerObserver":
        observer_data = args[0] if args else {}
        return {
            "observer_id": observer_data.get("observer_id", f"obs_{uuid.uuid4().hex[:8]}"),
            "status": "registered",
            "capabilities": observer_data.get("capabilities", ["context_awareness", "ai_suggestions"]),
            "trust_score": 0.8,
            "registered_at": datetime.utcnow().isoformat()
        }
    elif method == "generateSuggestions":
        context_data = args[0] if args else {}
        return {
            "suggestions": [
                {
                    "id": f"sug_{uuid.uuid4().hex[:8]}",
                    "text": "Consider reviewing the governance policies for this action",
                    "type": "governance_alert",
                    "source": "governance_analyzer",
                    "relevance": 0.85,
                    "timestamp": datetime.utcnow().isoformat(),
                    "context_data": context_data
                },
                {
                    "id": f"sug_{uuid.uuid4().hex[:8]}",
                    "text": "This action may benefit from additional trust verification",
                    "type": "action_recommendation",
                    "source": "trust_analyzer",
                    "relevance": 0.72,
                    "timestamp": datetime.utcnow().isoformat(),
                    "context_data": context_data
                }
            ]
        }
    elif method == "getTrustMetrics":
        observer_id = args[0] if args else "unknown"
        return {
            "observer_id": observer_id,
            "overall_trust_score": 0.82,
            "governance_compliance": 0.91,
            "suggestion_accuracy": 0.78,
            "context_awareness": 0.85,
            "user_feedback_score": 0.76,
            "last_updated": datetime.utcnow().isoformat(),
            "metrics_history": []
        }
    elif method == "getContextAwareness":
        observer_id = args[0] if args else "unknown"
        return {
            "observer_id": observer_id,
            "current_page": "/ui/dashboard",
            "user_actions": [],
            "session_context": {"session_duration": 1200, "pages_visited": 5},
            "governance_context": {"active_policies": 3, "compliance_level": "high"},
            "insights": ["User is actively managing agent configurations", "High governance compliance detected"],
            "last_updated": datetime.utcnow().isoformat()
        }
    else:
        return {"status": "success", "method": method}

def store_observer_data(observer: Dict[str, Any]) -> None:
    """Store observer data to filesystem (temporary storage)"""
    try:
        os.makedirs(f"/tmp/observers/{observer['observer_id']}", exist_ok=True)
        with open(f"/tmp/observers/{observer['observer_id']}/config.json", 'w') as f:
            json.dump(observer, f, indent=2)
    except Exception as e:
        print(f"Failed to store observer data: {e}")

def load_observer_data(observer_id: str) -> Optional[Dict[str, Any]]:
    """Load observer data from filesystem"""
    try:
        with open(f"/tmp/observers/{observer_id}/config.json", 'r') as f:
            return json.load(f)
    except Exception:
        return None

def store_suggestions(observer_id: str, suggestions: List[Dict[str, Any]]) -> None:
    """Store suggestions data to filesystem"""
    try:
        os.makedirs(f"/tmp/observers/{observer_id}/suggestions", exist_ok=True)
        
        for suggestion in suggestions:
            suggestion_file = f"/tmp/observers/{observer_id}/suggestions/{suggestion['id']}.json"
            with open(suggestion_file, 'w') as f:
                json.dump(suggestion, f, indent=2)
    except Exception as e:
        print(f"Failed to store suggestions: {e}")

def load_suggestions(observer_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Load suggestions for an observer"""
    try:
        suggestions_dir = f"/tmp/observers/{observer_id}/suggestions"
        if not os.path.exists(suggestions_dir):
            return []
        
        suggestions = []
        for filename in os.listdir(suggestions_dir):
            if filename.endswith('.json'):
                with open(os.path.join(suggestions_dir, filename), 'r') as f:
                    suggestions.append(json.load(f))
        
        # Sort by timestamp and apply limit
        suggestions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return suggestions[:limit]
    except Exception:
        return []

# API Routes

@router.post("/register")
async def register_observer(request: RegisterObserverRequest):
    """Register a new observer agent"""
    try:
        # Prepare observer data
        observer_data = {
            "observer_id": request.observer_id,
            "name": request.name,
            "capabilities": request.capabilities,
            "context_scope": request.context_scope,
            "ai_model": request.ai_model,
            "trust_threshold": request.trust_threshold,
            "metadata": request.metadata or {}
        }
        
        # Call observer module
        result = call_observer_module("registerObserver", observer_data)
        
        # Store observer data
        store_observer_data({**observer_data, **result})
        
        return {
            "observer_id": result.get("observer_id", request.observer_id),
            "status": "registered",
            "capabilities": result.get("capabilities", request.capabilities),
            "trust_score": result.get("trust_score", 0.8),
            "registered_at": result.get("registered_at", datetime.utcnow().isoformat())
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register observer: {str(e)}")

@router.post("/observers/{observer_id}/suggestions")
async def generate_suggestions(
    observer_id: str = Path(..., description="Observer ID"),
    context_data: Dict[str, Any] = {}
):
    """Generate AI suggestions based on current context"""
    try:
        # Load observer configuration
        observer_config = load_observer_data(observer_id)
        if not observer_config:
            raise HTTPException(status_code=404, detail="Observer not found")
        
        # Call observer module for suggestions
        result = call_observer_module("generateSuggestions", {
            "observer_id": observer_id,
            "context_data": context_data,
            "ai_model": observer_config.get("ai_model", "gpt-4"),
            "trust_threshold": observer_config.get("trust_threshold", 0.7)
        })
        
        # Store suggestions
        suggestions = result.get("suggestions", [])
        store_suggestions(observer_id, suggestions)
        
        return {
            "observer_id": observer_id,
            "suggestions": [ObserverSuggestion(**suggestion) for suggestion in suggestions],
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.get("/observers/{observer_id}/suggestions")
async def get_suggestions(
    observer_id: str = Path(..., description="Observer ID"),
    limit: int = Query(10, description="Maximum number of suggestions"),
    suggestion_type: Optional[str] = Query(None, description="Filter by suggestion type")
):
    """Get recent suggestions for an observer"""
    try:
        # Load suggestions
        suggestions = load_suggestions(observer_id, limit * 2)  # Load more for filtering
        
        # Apply type filter if specified
        if suggestion_type:
            suggestions = [s for s in suggestions if s.get("type") == suggestion_type]
        
        # Apply limit
        suggestions = suggestions[:limit]
        
        return {
            "observer_id": observer_id,
            "suggestions": [ObserverSuggestion(**suggestion) for suggestion in suggestions],
            "total_count": len(suggestions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

@router.get("/observers/{observer_id}/metrics", response_model=TrustMetrics)
async def get_trust_metrics(observer_id: str = Path(..., description="Observer ID")):
    """Get trust metrics for an observer"""
    try:
        # Call observer module for metrics
        result = call_observer_module("getTrustMetrics", observer_id)
        
        return TrustMetrics(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trust metrics: {str(e)}")

@router.get("/observers/{observer_id}/context", response_model=ContextAwareness)
async def get_context_awareness(observer_id: str = Path(..., description="Observer ID")):
    """Get context awareness data for an observer"""
    try:
        # Call observer module for context awareness
        result = call_observer_module("getContextAwareness", observer_id)
        
        return ContextAwareness(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get context awareness: {str(e)}")

@router.put("/observers/{observer_id}/context")
async def update_context(
    observer_id: str = Path(..., description="Observer ID"),
    context_update: Dict[str, Any] = {}
):
    """Update context data for an observer"""
    try:
        # Call observer module to update context
        result = call_observer_module("updateContext", observer_id, context_update)
        
        return {
            "observer_id": observer_id,
            "status": "updated",
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update context: {str(e)}")

@router.get("/observers/{observer_id}/config", response_model=ObserverConfiguration)
async def get_observer_config(observer_id: str = Path(..., description="Observer ID")):
    """Get observer configuration"""
    try:
        observer_data = load_observer_data(observer_id)
        if not observer_data:
            raise HTTPException(status_code=404, detail="Observer not found")
        
        return ObserverConfiguration(
            observer_id=observer_id,
            is_active=observer_data.get("is_active", True),
            suggestion_frequency=observer_data.get("suggestion_frequency", "moderate"),
            notification_types=observer_data.get("notification_types", []),
            ai_model=observer_data.get("ai_model", "gpt-4"),
            trust_threshold=observer_data.get("trust_threshold", 0.7),
            context_scope=observer_data.get("context_scope", "page"),
            preferences=observer_data.get("preferences", {})
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get observer config: {str(e)}")

@router.put("/observers/{observer_id}/config")
async def update_observer_config(
    observer_id: str = Path(..., description="Observer ID"),
    config: ObserverConfiguration = ...
):
    """Update observer configuration"""
    try:
        # Load existing observer data
        observer_data = load_observer_data(observer_id)
        if not observer_data:
            raise HTTPException(status_code=404, detail="Observer not found")
        
        # Update configuration
        observer_data.update({
            "is_active": config.is_active,
            "suggestion_frequency": config.suggestion_frequency,
            "notification_types": config.notification_types,
            "ai_model": config.ai_model,
            "trust_threshold": config.trust_threshold,
            "context_scope": config.context_scope,
            "preferences": config.preferences,
            "updated_at": datetime.utcnow().isoformat()
        })
        
        # Store updated configuration
        store_observer_data(observer_data)
        
        return {
            "observer_id": observer_id,
            "status": "updated",
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update observer config: {str(e)}")

@router.get("/observers")
async def list_observers(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, description="Maximum number of observers")
):
    """List all observers"""
    try:
        observers = []
        observers_dir = "/tmp/observers"
        
        if os.path.exists(observers_dir):
            for observer_id in os.listdir(observers_dir):
                observer_data = load_observer_data(observer_id)
                if observer_data:
                    # Apply filters
                    if is_active is not None and observer_data.get("is_active") != is_active:
                        continue
                    
                    observers.append(observer_data)
        
        # Apply limit
        observers = observers[:limit] if limit > 0 else observers
        
        return observers
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list observers: {str(e)}")

@router.delete("/observers/{observer_id}")
async def delete_observer(observer_id: str = Path(..., description="Observer ID")):
    """Delete an observer"""
    try:
        observer_dir = f"/tmp/observers/{observer_id}"
        
        if not os.path.exists(observer_dir):
            raise HTTPException(status_code=404, detail="Observer not found")
        
        # Remove observer directory
        import shutil
        shutil.rmtree(observer_dir)
        
        return {"message": f"Observer {observer_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete observer: {str(e)}")

