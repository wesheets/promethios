"""
Simplified Model Registry for LLM Coordination

This is a simplified version of the model registry focused specifically
on LLM model management and coordination. It integrates with the existing
AI Model Service rather than duplicating functionality.

Purpose:
- Centralized LLM model discovery and selection
- Model performance tracking for coordination decisions
- Integration with existing AI Model Service
- Support for model routing and load balancing
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from enum import Enum
from pydantic import BaseModel

# Import existing AI model service
from ...api.chat.ai_model_service import ModelProvider, ModelCapability

logger = logging.getLogger(__name__)

class ModelStatus(Enum):
    """Model availability status."""
    AVAILABLE = "available"
    BUSY = "busy"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"

class ModelMetrics(BaseModel):
    """Model performance metrics."""
    response_time_avg: float
    success_rate: float
    quality_score: float
    usage_count: int
    last_updated: str

class ModelInfo(BaseModel):
    """Model information for coordination."""
    model_id: str
    provider: ModelProvider
    capabilities: List[ModelCapability]
    status: ModelStatus
    metrics: ModelMetrics
    cost_per_token: Optional[float] = None
    max_tokens: Optional[int] = None
    context_window: Optional[int] = None

class SimplifiedModelRegistry:
    """
    Simplified model registry for LLM coordination.
    
    This registry focuses on model selection and routing for the LLM service
    rather than duplicating the comprehensive model management in AI Model Service.
    """
    
    def __init__(self):
        """Initialize the simplified model registry."""
        self.models: Dict[str, ModelInfo] = {}
        self._initialize_default_models()
        logger.info("Simplified Model Registry initialized")
    
    def _initialize_default_models(self):
        """Initialize with default model configurations."""
        default_models = [
            {
                "model_id": "gpt-4",
                "provider": ModelProvider.OPENAI,
                "capabilities": [
                    ModelCapability.TEXT_GENERATION,
                    ModelCapability.CONVERSATION,
                    ModelCapability.REASONING,
                    ModelCapability.CREATIVE_WRITING,
                    ModelCapability.FACTUAL_ANALYSIS,
                    ModelCapability.CODE_GENERATION
                ],
                "status": ModelStatus.AVAILABLE,
                "metrics": ModelMetrics(
                    response_time_avg=2.5,
                    success_rate=0.98,
                    quality_score=0.95,
                    usage_count=0,
                    last_updated=datetime.utcnow().isoformat()
                ),
                "cost_per_token": 0.00003,
                "max_tokens": 4096,
                "context_window": 8192
            },
            {
                "model_id": "claude-3-sonnet",
                "provider": ModelProvider.ANTHROPIC,
                "capabilities": [
                    ModelCapability.TEXT_GENERATION,
                    ModelCapability.CONVERSATION,
                    ModelCapability.REASONING,
                    ModelCapability.FACTUAL_ANALYSIS,
                    ModelCapability.CREATIVE_WRITING
                ],
                "status": ModelStatus.AVAILABLE,
                "metrics": ModelMetrics(
                    response_time_avg=3.0,
                    success_rate=0.97,
                    quality_score=0.93,
                    usage_count=0,
                    last_updated=datetime.utcnow().isoformat()
                ),
                "cost_per_token": 0.000015,
                "max_tokens": 4096,
                "context_window": 200000
            },
            {
                "model_id": "gpt-3.5-turbo",
                "provider": ModelProvider.OPENAI,
                "capabilities": [
                    ModelCapability.TEXT_GENERATION,
                    ModelCapability.CONVERSATION,
                    ModelCapability.FACTUAL_ANALYSIS
                ],
                "status": ModelStatus.AVAILABLE,
                "metrics": ModelMetrics(
                    response_time_avg=1.5,
                    success_rate=0.96,
                    quality_score=0.85,
                    usage_count=0,
                    last_updated=datetime.utcnow().isoformat()
                ),
                "cost_per_token": 0.000001,
                "max_tokens": 4096,
                "context_window": 16384
            }
        ]
        
        for model_data in default_models:
            model_info = ModelInfo(**model_data)
            self.models[model_info.model_id] = model_info
    
    def select_best_model(
        self, 
        required_capabilities: List[ModelCapability],
        priority: str = "balanced"  # "speed", "quality", "cost", "balanced"
    ) -> Optional[ModelInfo]:
        """
        Select the best model based on requirements and priority.
        
        Args:
            required_capabilities: List of required capabilities
            priority: Selection priority (speed, quality, cost, balanced)
            
        Returns:
            Best matching model or None if no suitable model found
        """
        suitable_models = []
        
        for model in self.models.values():
            if model.status != ModelStatus.AVAILABLE:
                continue
                
            # Check if model has required capabilities
            if all(cap in model.capabilities for cap in required_capabilities):
                suitable_models.append(model)
        
        if not suitable_models:
            return None
        
        # Select based on priority
        if priority == "speed":
            return min(suitable_models, key=lambda m: m.metrics.response_time_avg)
        elif priority == "quality":
            return max(suitable_models, key=lambda m: m.metrics.quality_score)
        elif priority == "cost":
            return min(suitable_models, key=lambda m: m.cost_per_token or float('inf'))
        else:  # balanced
            # Weighted score combining speed, quality, and cost
            def balanced_score(model):
                speed_score = 1.0 / (model.metrics.response_time_avg + 0.1)
                quality_score = model.metrics.quality_score
                cost_score = 1.0 / ((model.cost_per_token or 0.00001) * 100000 + 1)
                return (speed_score + quality_score + cost_score) / 3
            
            return max(suitable_models, key=balanced_score)
    
    def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        """Get information about a specific model."""
        return self.models.get(model_id)
    
    def list_available_models(self) -> List[ModelInfo]:
        """List all available models."""
        return [model for model in self.models.values() 
                if model.status == ModelStatus.AVAILABLE]
    
    def update_model_metrics(self, model_id: str, metrics: Dict[str, Any]):
        """Update model performance metrics."""
        if model_id in self.models:
            model = self.models[model_id]
            
            # Update metrics
            if "response_time" in metrics:
                # Update average response time
                current_avg = model.metrics.response_time_avg
                new_time = metrics["response_time"]
                count = model.metrics.usage_count
                model.metrics.response_time_avg = (current_avg * count + new_time) / (count + 1)
            
            if "success" in metrics:
                # Update success rate
                current_rate = model.metrics.success_rate
                count = model.metrics.usage_count
                success = 1.0 if metrics["success"] else 0.0
                model.metrics.success_rate = (current_rate * count + success) / (count + 1)
            
            if "quality_score" in metrics:
                # Update quality score (weighted average)
                current_score = model.metrics.quality_score
                new_score = metrics["quality_score"]
                count = model.metrics.usage_count
                model.metrics.quality_score = (current_score * count + new_score) / (count + 1)
            
            # Increment usage count
            model.metrics.usage_count += 1
            model.metrics.last_updated = datetime.utcnow().isoformat()
            
            logger.info(f"Updated metrics for model {model_id}")
    
    def set_model_status(self, model_id: str, status: ModelStatus):
        """Update model status."""
        if model_id in self.models:
            self.models[model_id].status = status
            logger.info(f"Set model {model_id} status to {status.value}")
    
    def get_model_recommendations(self, task_type: str) -> List[ModelInfo]:
        """
        Get model recommendations for a specific task type.
        
        Args:
            task_type: Type of task (research, creative, analysis, etc.)
            
        Returns:
            List of recommended models sorted by suitability
        """
        task_capability_mapping = {
            "research": [ModelCapability.FACTUAL_ANALYSIS, ModelCapability.REASONING],
            "creative": [ModelCapability.CREATIVE_WRITING, ModelCapability.TEXT_GENERATION],
            "analysis": [ModelCapability.REASONING, ModelCapability.FACTUAL_ANALYSIS],
            "conversation": [ModelCapability.CONVERSATION, ModelCapability.TEXT_GENERATION],
            "coding": [ModelCapability.CODE_GENERATION, ModelCapability.REASONING],
            "general": [ModelCapability.TEXT_GENERATION, ModelCapability.CONVERSATION]
        }
        
        required_capabilities = task_capability_mapping.get(task_type, 
                                                           task_capability_mapping["general"])
        
        suitable_models = []
        for model in self.models.values():
            if (model.status == ModelStatus.AVAILABLE and 
                any(cap in model.capabilities for cap in required_capabilities)):
                suitable_models.append(model)
        
        # Sort by quality score for recommendations
        return sorted(suitable_models, key=lambda m: m.metrics.quality_score, reverse=True)

# Global registry instance
simplified_model_registry = SimplifiedModelRegistry()

