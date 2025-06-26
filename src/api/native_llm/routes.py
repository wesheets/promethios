"""
API Routes for Native LLM Extension

This module provides REST API endpoints for the Native LLM extension,
enabling external access to governance-native language model capabilities.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, AsyncGenerator
import asyncio
import json
import logging
from datetime import datetime

# Import Native LLM components
from ...extensions.native_llm.native_llm_extension import (
    native_llm_extension,
    NativeLLMConfig,
    NativeLLMResponse,
    ModelSize,
    GenerationMode
)
from ...extensions.native_llm.governance_integration import (
    governance_integration_service,
    ComplianceLevel
)

logger = logging.getLogger(__name__)

# Create router
native_llm_router = APIRouter(prefix="/api/native-llm", tags=["Native LLM"])

# Request/Response models
class GenerationRequest(BaseModel):
    """Request model for text generation."""
    prompt: str = Field(..., description="Input prompt for generation")
    config: Optional[NativeLLMConfig] = Field(None, description="Optional configuration override")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    model_id: str = Field("default", description="Model identifier to use")
    compliance_level: ComplianceLevel = Field(ComplianceLevel.BALANCED, description="Compliance enforcement level")
    
    class Config:
        schema_extra = {
            "example": {
                "prompt": "Explain the benefits of renewable energy",
                "context": {"domain": "environment", "audience": "general"},
                "model_id": "default",
                "compliance_level": "balanced"
            }
        }

class StreamingGenerationRequest(BaseModel):
    """Request model for streaming text generation."""
    prompt: str = Field(..., description="Input prompt for generation")
    config: Optional[NativeLLMConfig] = Field(None, description="Optional configuration override")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    model_id: str = Field("default", description="Model identifier to use")
    max_tokens: int = Field(1024, description="Maximum tokens to generate")
    
    class Config:
        schema_extra = {
            "example": {
                "prompt": "Write a comprehensive analysis of...",
                "max_tokens": 2048,
                "model_id": "default"
            }
        }

class ModelInfoResponse(BaseModel):
    """Response model for model information."""
    model_id: str
    config: Dict[str, Any]
    is_loaded: bool
    model_path: str
    capabilities: List[str]
    status: str
    last_used: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "model_id": "default",
                "is_loaded": True,
                "capabilities": ["governance_native", "trust_aware"],
                "status": "ready"
            }
        }

class HealthCheckResponse(BaseModel):
    """Response model for health check."""
    status: str
    native_llm_status: str
    governance_integration_status: str
    models_loaded: int
    total_generations: int
    average_response_time: float
    last_check: str
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "native_llm_status": "ready",
                "governance_integration_status": "connected",
                "models_loaded": 1,
                "total_generations": 1234
            }
        }

# Dependency functions
async def get_native_llm_extension():
    """Get the native LLM extension instance."""
    if not native_llm_extension:
        raise HTTPException(status_code=503, detail="Native LLM extension not available")
    return native_llm_extension

async def get_governance_integration():
    """Get the governance integration service."""
    if not governance_integration_service.is_initialized:
        await governance_integration_service.initialize()
    return governance_integration_service

# API Endpoints

@native_llm_router.post("/generate", response_model=NativeLLMResponse)
async def generate_text(
    request: GenerationRequest,
    extension = Depends(get_native_llm_extension),
    governance_service = Depends(get_governance_integration)
):
    """
    Generate text using governance-native language model.
    
    This endpoint provides governance-aware text generation with real-time
    compliance monitoring and trust calibration.
    """
    try:
        logger.info(f"Text generation request: {request.prompt[:50]}...")
        
        # Generate text using native LLM
        response = await extension.generate(
            prompt=request.prompt,
            config=request.config,
            context=request.context,
            model_id=request.model_id
        )
        
        # Process through governance integration
        governance_result = await governance_service.process_generation(
            prompt=request.prompt,
            generated_text=response.text,
            context=request.context,
            compliance_level=request.compliance_level
        )
        
        # Update response with governance results
        if not governance_result.get("overall_approved", True):
            response.compliance_status = "review_required"
            response.text = "Response requires additional review due to governance constraints."
        
        logger.info(f"Generation completed: {response.compliance_status}")
        return response
        
    except Exception as e:
        logger.error(f"Error in text generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")

@native_llm_router.post("/generate/stream")
async def stream_generate_text(
    request: StreamingGenerationRequest,
    extension = Depends(get_native_llm_extension)
):
    """
    Stream text generation for long-form content.
    
    This endpoint provides streaming text generation for scenarios requiring
    real-time output or very long responses.
    """
    async def generate_stream() -> AsyncGenerator[str, None]:
        try:
            # For now, simulate streaming by chunking a complete response
            response = await extension.generate(
                prompt=request.prompt,
                config=request.config,
                context=request.context,
                model_id=request.model_id
            )
            
            # Stream the response in chunks
            text = response.text
            chunk_size = 50
            
            for i in range(0, len(text), chunk_size):
                chunk = text[i:i + chunk_size]
                
                stream_data = {
                    "chunk": chunk,
                    "chunk_index": i // chunk_size,
                    "is_final": i + chunk_size >= len(text),
                    "governance_score": response.governance_score,
                    "trust_score": response.trust_score,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                yield f"data: {json.dumps(stream_data)}\n\n"
                await asyncio.sleep(0.1)  # Simulate streaming delay
                
        except Exception as e:
            error_data = {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@native_llm_router.get("/models", response_model=List[ModelInfoResponse])
async def list_models(extension = Depends(get_native_llm_extension)):
    """
    List all available native LLM models.
    
    Returns information about all loaded and available models,
    including their capabilities and current status.
    """
    try:
        models_info = await extension.list_models()
        
        # Convert to response format
        response_models = []
        for model_info in models_info:
            response_models.append(ModelInfoResponse(
                model_id=model_info["model_id"],
                config=model_info["config"],
                is_loaded=model_info["is_loaded"],
                model_path=model_info["model_path"],
                capabilities=model_info["capabilities"],
                status="ready" if model_info["is_loaded"] else "not_loaded"
            ))
        
        return response_models
        
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing models: {str(e)}")

@native_llm_router.get("/models/{model_id}", response_model=ModelInfoResponse)
async def get_model_info(
    model_id: str,
    extension = Depends(get_native_llm_extension)
):
    """
    Get detailed information about a specific model.
    
    Returns comprehensive information about the specified model,
    including configuration, capabilities, and performance metrics.
    """
    try:
        model_info = await extension.get_model_info(model_id)
        
        if "error" in model_info:
            raise HTTPException(status_code=404, detail=model_info["error"])
        
        return ModelInfoResponse(
            model_id=model_info["model_id"],
            config=model_info["config"],
            is_loaded=model_info["is_loaded"],
            model_path=model_info["model_path"],
            capabilities=model_info["capabilities"],
            status="ready" if model_info["is_loaded"] else "not_loaded"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting model info: {str(e)}")

@native_llm_router.post("/models/{model_id}/load")
async def load_model(
    model_id: str,
    config: Optional[NativeLLMConfig] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    extension = Depends(get_native_llm_extension)
):
    """
    Load a specific model with optional configuration.
    
    This endpoint loads a model into memory, making it available for generation.
    Loading happens in the background for large models.
    """
    try:
        # Add model loading to background tasks for large models
        async def load_model_task():
            try:
                await extension.generate(
                    prompt="initialization test",
                    config=config,
                    model_id=model_id
                )
                logger.info(f"Model {model_id} loaded successfully")
            except Exception as e:
                logger.error(f"Error loading model {model_id}: {str(e)}")
        
        background_tasks.add_task(load_model_task)
        
        return {
            "message": f"Model {model_id} loading initiated",
            "model_id": model_id,
            "status": "loading",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error initiating model load: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")

@native_llm_router.delete("/models/{model_id}")
async def unload_model(
    model_id: str,
    extension = Depends(get_native_llm_extension)
):
    """
    Unload a specific model from memory.
    
    This endpoint removes a model from memory to free up resources.
    The model can be reloaded later if needed.
    """
    try:
        if model_id == "default":
            raise HTTPException(status_code=400, detail="Cannot unload default model")
        
        if model_id in extension.models:
            del extension.models[model_id]
            logger.info(f"Model {model_id} unloaded")
            
            return {
                "message": f"Model {model_id} unloaded successfully",
                "model_id": model_id,
                "status": "unloaded",
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unloading model: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error unloading model: {str(e)}")

@native_llm_router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    extension = Depends(get_native_llm_extension),
    governance_service = Depends(get_governance_integration)
):
    """
    Comprehensive health check for Native LLM system.
    
    Returns detailed health information about all components,
    including models, governance integration, and performance metrics.
    """
    try:
        # Check extension status
        models_loaded = len(extension.models)
        extension_status = "ready" if models_loaded > 0 else "no_models_loaded"
        
        # Check governance integration status
        governance_status = await governance_service.get_integration_status()
        
        # Get performance metrics
        integration_metrics = governance_status.get("metrics", {})
        
        return HealthCheckResponse(
            status="healthy" if extension_status == "ready" and governance_status["initialized"] else "degraded",
            native_llm_status=extension_status,
            governance_integration_status="connected" if governance_status["initialized"] else "disconnected",
            models_loaded=models_loaded,
            total_generations=integration_metrics.get("total_generations", 0),
            average_response_time=2.5,  # Would be calculated from actual metrics
            last_check=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return HealthCheckResponse(
            status="error",
            native_llm_status="error",
            governance_integration_status="error",
            models_loaded=0,
            total_generations=0,
            average_response_time=0.0,
            last_check=datetime.utcnow().isoformat()
        )

@native_llm_router.get("/capabilities")
async def get_capabilities():
    """
    Get comprehensive capabilities information for Native LLM system.
    
    Returns detailed information about supported features, models,
    and integration capabilities.
    """
    try:
        capabilities = {
            "generation_modes": [mode.value for mode in GenerationMode],
            "model_sizes": [size.value for size in ModelSize],
            "compliance_levels": [level.value for level in ComplianceLevel],
            "features": [
                "governance_native_generation",
                "trust_aware_responses",
                "real_time_compliance_monitoring",
                "multi_agent_coordination",
                "emotional_intelligence_integration",
                "collective_intelligence_enhancement",
                "streaming_generation",
                "custom_model_loading",
                "backward_compatibility"
            ],
            "integrations": [
                "promethios_governance_core",
                "trust_propagation_engine",
                "veritas_emotional_intelligence",
                "multi_agent_coordination_apis",
                "collective_intelligence_assessor"
            ],
            "api_version": "1.0.0",
            "extension_version": native_llm_extension.version,
            "supported_formats": ["json", "text", "streaming"],
            "max_context_length": 4096,
            "max_generation_length": 2048
        }
        
        return capabilities
        
    except Exception as e:
        logger.error(f"Error getting capabilities: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting capabilities: {str(e)}")

@native_llm_router.post("/evaluate")
async def evaluate_text(
    text: str,
    context: Optional[Dict[str, Any]] = None,
    governance_service = Depends(get_governance_integration)
):
    """
    Evaluate text for governance compliance and trust metrics.
    
    This endpoint allows evaluation of arbitrary text using the same
    governance and trust systems used for generation.
    """
    try:
        # Process text through governance integration
        result = await governance_service.process_generation(
            prompt="[evaluation request]",
            generated_text=text,
            context=context or {}
        )
        
        return {
            "text": text,
            "evaluation_results": result,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error evaluating text: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error evaluating text: {str(e)}")

# Error handlers
@native_llm_router.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler for Native LLM API."""
    logger.error(f"Unhandled exception in Native LLM API: {str(exc)}")
    return HTTPException(
        status_code=500,
        detail={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Include router in main application
def include_native_llm_routes(app):
    """Include Native LLM routes in the main FastAPI application."""
    app.include_router(native_llm_router)

