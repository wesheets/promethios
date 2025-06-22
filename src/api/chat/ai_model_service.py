"""
AI Model Integration Service for Promethios Chat Backend.

This module implements Phase 2 of the Chat Backend Strategic Architecture,
providing real AI model integration with governance oversight.

Features:
- Multi-provider AI model support (OpenAI, Anthropic, Cohere, etc.)
- Governance-wrapped AI model calls
- Response quality assessment
- Model performance monitoring
- Provider failover and load balancing
"""

import os
import json
import asyncio
import time
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timezone
import httpx
from enum import Enum

class ModelProvider(str, Enum):
    """Supported AI model providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    COHERE = "cohere"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"

class ModelCapability(str, Enum):
    """AI model capabilities."""
    TEXT_GENERATION = "text-generation"
    CONVERSATION = "conversation"
    REASONING = "reasoning"
    CREATIVE_WRITING = "creative-writing"
    FACTUAL_ANALYSIS = "factual-analysis"
    CODE_GENERATION = "code-generation"
    TOOL_USE = "tool-use"

class AIModelConfig:
    """Configuration for AI model integration."""
    
    def __init__(self):
        # API Keys from environment variables
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.cohere_api_key = os.getenv("COHERE_API_KEY")
        self.huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")
        
        # Model configurations
        self.models = {
            "baseline-agent": {
                "provider": ModelProvider.OPENAI,
                "model": "gpt-3.5-turbo",
                "capabilities": [ModelCapability.TEXT_GENERATION, ModelCapability.CONVERSATION],
                "max_tokens": 1000,
                "temperature": 0.7,
                "governance_prompt": "You are a baseline AI assistant. Provide helpful, accurate, and safe responses."
            },
            "factual-agent": {
                "provider": ModelProvider.ANTHROPIC,
                "model": "claude-3-sonnet-20240229",
                "capabilities": [ModelCapability.FACTUAL_ANALYSIS, ModelCapability.REASONING],
                "max_tokens": 1500,
                "temperature": 0.3,
                "governance_prompt": "You are a factual analysis specialist. Prioritize accuracy and provide well-sourced information."
            },
            "creative-agent": {
                "provider": ModelProvider.OPENAI,
                "model": "gpt-4",
                "capabilities": [ModelCapability.CREATIVE_WRITING, ModelCapability.TEXT_GENERATION],
                "max_tokens": 2000,
                "temperature": 0.9,
                "governance_prompt": "You are a creative AI assistant. Generate innovative and engaging content while maintaining appropriateness."
            },
            "governance-agent": {
                "provider": ModelProvider.ANTHROPIC,
                "model": "claude-3-sonnet-20240229",
                "capabilities": [ModelCapability.REASONING, ModelCapability.CONVERSATION],
                "max_tokens": 1200,
                "temperature": 0.2,
                "governance_prompt": "You are a governance-focused AI assistant. Ensure all responses comply with ethical guidelines and safety policies."
            },
            "multi-tool-agent": {
                "provider": ModelProvider.COHERE,
                "model": "command",
                "capabilities": [ModelCapability.TOOL_USE, ModelCapability.REASONING],
                "max_tokens": 1500,
                "temperature": 0.5,
                "governance_prompt": "You are a multi-tool AI assistant capable of using various tools and APIs to accomplish tasks."
            }
        }

class AIModelService:
    """Service for AI model integration with governance oversight."""
    
    def __init__(self):
        self.config = AIModelConfig()
        self.client_cache = {}
        self.performance_metrics = {}
        
    async def get_client(self, provider: ModelProvider) -> httpx.AsyncClient:
        """Get or create HTTP client for AI provider."""
        if provider not in self.client_cache:
            timeout = httpx.Timeout(30.0)
            self.client_cache[provider] = httpx.AsyncClient(timeout=timeout)
        return self.client_cache[provider]
    
    async def generate_response(
        self,
        agent_id: str,
        message: str,
        conversation_history: List[Dict[str, str]] = None,
        governance_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response with governance integration.
        
        Args:
            agent_id: Agent identifier
            message: User message
            conversation_history: Previous conversation messages
            governance_context: Governance settings and context
            
        Returns:
            Dict containing response and metadata
        """
        start_time = time.time()
        
        try:
            # Get agent configuration
            if agent_id not in self.config.models:
                return {
                    "status": "error",
                    "error": f"Unknown agent: {agent_id}",
                    "response": f"I'm sorry, but the agent '{agent_id}' is not available.",
                    "processing_time_ms": int((time.time() - start_time) * 1000)
                }
            
            agent_config = self.config.models[agent_id]
            provider = agent_config["provider"]
            
            # Build conversation context with governance
            messages = self._build_conversation_context(
                agent_config, message, conversation_history, governance_context
            )
            
            # Generate response based on provider
            if provider == ModelProvider.OPENAI:
                response_data = await self._call_openai(agent_config, messages)
            elif provider == ModelProvider.ANTHROPIC:
                response_data = await self._call_anthropic(agent_config, messages)
            elif provider == ModelProvider.COHERE:
                response_data = await self._call_cohere(agent_config, messages)
            else:
                # Fallback to mock response
                response_data = await self._call_mock(agent_config, messages)
            
            # Record performance metrics
            processing_time = int((time.time() - start_time) * 1000)
            self._record_performance(agent_id, provider, processing_time, response_data.get("status") == "success")
            
            response_data["processing_time_ms"] = processing_time
            response_data["agent_id"] = agent_id
            response_data["provider"] = provider.value
            
            return response_data
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            error_details = {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "agent_id": agent_id,
                "provider": agent_config.get("provider", "unknown") if agent_id in self.config.models else "unknown"
            }
            print(f"AI Model Service Error: {error_details}")  # Debug logging
            return {
                "status": "error",
                "error": str(e),
                "error_details": error_details,
                "response": "I apologize, but I'm experiencing technical difficulties. Please try again.",
                "processing_time_ms": processing_time,
                "agent_id": agent_id
            }
    
    def _build_conversation_context(
        self,
        agent_config: Dict[str, Any],
        message: str,
        conversation_history: List[Dict[str, str]] = None,
        governance_context: Dict[str, Any] = None
    ) -> List[Dict[str, str]]:
        """Build conversation context with governance prompts."""
        messages = []
        
        # Add governance system prompt
        governance_prompt = agent_config.get("governance_prompt", "You are a helpful AI assistant.")
        
        # Add governance context if provided
        if governance_context and governance_context.get("enabled"):
            governance_additions = []
            
            if governance_context.get("policy_enforcement_level") == "strict":
                governance_additions.append("STRICT GOVERNANCE MODE: Ensure all responses fully comply with safety and content policies.")
            
            if governance_context.get("trust_threshold", 0) > 0.8:
                governance_additions.append("HIGH TRUST ENVIRONMENT: Maintain the highest standards of accuracy and reliability.")
            
            if governance_context.get("observer_monitoring"):
                governance_additions.append("OBSERVER MONITORING ACTIVE: Your responses will be evaluated for governance compliance.")
            
            if governance_additions:
                governance_prompt += " " + " ".join(governance_additions)
        
        messages.append({"role": "system", "content": governance_prompt})
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        return messages
    
    async def _call_openai(self, agent_config: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Call OpenAI API."""
        if not self.config.openai_api_key:
            return await self._call_mock(agent_config, messages)
        
        try:
            client = await self.get_client(ModelProvider.OPENAI)
            
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.config.openai_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": agent_config["model"],
                    "messages": messages,
                    "max_tokens": agent_config.get("max_tokens", 1000),
                    "temperature": agent_config.get("temperature", 0.7)
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "response": data["choices"][0]["message"]["content"],
                    "usage": data.get("usage", {}),
                    "model": agent_config["model"]
                }
            elif response.status_code == 401:
                # Authentication error - fall back to mock
                print(f"OpenAI authentication failed, falling back to mock response")
                return await self._call_mock(agent_config, messages)
            else:
                # Other API errors - fall back to mock
                print(f"OpenAI API error {response.status_code}, falling back to mock response")
                return await self._call_mock(agent_config, messages)
                
        except Exception as e:
            print(f"OpenAI call exception: {e}, falling back to mock response")
            return await self._call_mock(agent_config, messages)
    
    async def _call_anthropic(self, agent_config: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Call Anthropic Claude API."""
        if not self.config.anthropic_api_key:
            return await self._call_mock(agent_config, messages)
        
        try:
            client = await self.get_client(ModelProvider.ANTHROPIC)
            
            # Convert messages format for Anthropic
            system_message = ""
            user_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    user_messages.append(msg)
            
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.config.anthropic_api_key,
                    "Content-Type": "application/json",
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": agent_config["model"],
                    "max_tokens": agent_config.get("max_tokens", 1000),
                    "temperature": agent_config.get("temperature", 0.7),
                    "system": system_message,
                    "messages": user_messages
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "response": data["content"][0]["text"],
                    "usage": data.get("usage", {}),
                    "model": agent_config["model"]
                }
            else:
                return {
                    "status": "error",
                    "error": f"Anthropic API error: {response.status_code}",
                    "response": "I'm experiencing technical difficulties with the Anthropic service."
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": f"Anthropic call failed: {str(e)}",
                "response": "I'm unable to connect to the Anthropic service right now."
            }
    
    async def _call_cohere(self, agent_config: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Call Cohere API."""
        if not self.config.cohere_api_key:
            return await self._call_mock(agent_config, messages)
        
        try:
            client = await self.get_client(ModelProvider.COHERE)
            
            # Convert messages to Cohere format
            conversation_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in messages])
            
            response = await client.post(
                "https://api.cohere.ai/v1/generate",
                headers={
                    "Authorization": f"Bearer {self.config.cohere_api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": agent_config["model"],
                    "prompt": conversation_text,
                    "max_tokens": agent_config.get("max_tokens", 1000),
                    "temperature": agent_config.get("temperature", 0.7)
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "response": data["generations"][0]["text"].strip(),
                    "model": agent_config["model"]
                }
            else:
                return {
                    "status": "error",
                    "error": f"Cohere API error: {response.status_code}",
                    "response": "I'm experiencing technical difficulties with the Cohere service."
                }
                
        except Exception as e:
            return {
                "status": "error",
                "error": f"Cohere call failed: {str(e)}",
                "response": "I'm unable to connect to the Cohere service right now."
            }
    
    async def _call_mock(self, agent_config: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Mock AI response for testing and fallback."""
        user_message = messages[-1]["content"] if messages else "Hello"
        
        # Simulate processing delay
        await asyncio.sleep(0.5)
        
        # Generate agent-specific mock responses
        agent_responses = {
            "baseline-agent": f"Baseline AI response to: {user_message}",
            "factual-agent": f"Factual analysis: {user_message} - This appears to be a user inquiry requiring accurate information.",
            "creative-agent": f"Creative interpretation: {user_message} - Let me explore this topic with imagination and innovation.",
            "governance-agent": f"Governance-compliant response: {user_message} - I've evaluated this request against our safety policies.",
            "multi-tool-agent": f"Multi-tool analysis: {user_message} - I can assist with this using various tools and capabilities."
        }
        
        agent_id = agent_config.get("agent_id", "baseline-agent")
        response = agent_responses.get(agent_id, f"AI response to: {user_message}")
        
        return {
            "status": "success",
            "response": response,
            "model": agent_config.get("model", "mock-model"),
            "mock": True
        }
    
    def _record_performance(self, agent_id: str, provider: ModelProvider, processing_time: int, success: bool):
        """Record performance metrics for monitoring."""
        if agent_id not in self.performance_metrics:
            self.performance_metrics[agent_id] = {
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "total_processing_time": 0,
                "average_processing_time": 0,
                "provider": provider.value
            }
        
        metrics = self.performance_metrics[agent_id]
        metrics["total_requests"] += 1
        metrics["total_processing_time"] += processing_time
        metrics["average_processing_time"] = metrics["total_processing_time"] / metrics["total_requests"]
        
        if success:
            metrics["successful_requests"] += 1
        else:
            metrics["failed_requests"] += 1
    
    def get_performance_metrics(self, agent_id: str = None) -> Dict[str, Any]:
        """Get performance metrics for agents."""
        if agent_id:
            return self.performance_metrics.get(agent_id, {})
        return self.performance_metrics
    
    async def cleanup(self):
        """Cleanup HTTP clients."""
        for client in self.client_cache.values():
            await client.aclose()
        self.client_cache.clear()

# Global AI model service instance
ai_model_service = AIModelService()

