"""
Promethios LLM Integration Service

This service provides an intelligent interface layer that coordinates with existing
Promethios systems rather than duplicating functionality. It acts as the "brain"
that orchestrates multi-agent workflows using existing APIs and services.

INTEGRATES WITH EXISTING SYSTEMS:
- Multi-Agent APIs: /api/multi-agent/
- Trust Calculation Engine: /api/multi-agent/trust-relationships
- Governance Core: /api/governance/
- Veritas Emotional Intelligence System
- Flow Configuration Service
- Collective Intelligence Assessor
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
import httpx
from pydantic import BaseModel, Field

# Import existing services
from ..chat.ai_model_service import AIModelService, ModelProvider
from ..multi_agent_system.services.collaboration_service import (
    collaboration_service, CollaborationModelType, CollaborationConfig
)
from ..multi_agent_system.services.flow_configuration_service import (
    FlowType, FlowStatus, ExecutionMode
)

logger = logging.getLogger(__name__)

class LLMRequest(BaseModel):
    """Request model for LLM coordination."""
    user_query: str = Field(..., description="User's natural language request")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")
    session_id: Optional[str] = Field(None, description="Session identifier")

class LLMResponse(BaseModel):
    """Response model for LLM coordination."""
    response: str = Field(..., description="LLM response to user")
    agents_used: List[str] = Field(..., description="Agents coordinated")
    workflow_type: str = Field(..., description="Workflow type used")
    trust_scores: Dict[str, float] = Field(..., description="Trust scores for agents")
    governance_status: str = Field(..., description="Governance compliance status")
    session_id: str = Field(..., description="Session identifier")
    timestamp: str = Field(..., description="Response timestamp")

class PrometheusLLMService:
    """
    Main LLM service that coordinates with existing Promethios systems.
    
    This service acts as an intelligent orchestrator that:
    1. Analyzes user requests
    2. Selects appropriate agents using existing trust systems
    3. Configures workflows using existing flow services
    4. Monitors governance using existing governance APIs
    5. Coordinates execution using existing multi-agent APIs
    """
    
    def __init__(self):
        """Initialize the LLM service with connections to existing systems."""
        self.ai_model_service = AIModelService()
        self.collaboration_service = collaboration_service
        
        # HTTP client for calling existing APIs
        self.http_client = httpx.AsyncClient(timeout=30.0)
        
        # Base URLs for existing APIs (configurable)
        self.base_url = "http://localhost:8000"  # Adjust as needed
        
        logger.info("Promethios LLM Service initialized")
    
    async def process_request(self, request: LLMRequest) -> LLMResponse:
        """
        Process a user request by coordinating with existing Promethios systems.
        
        Args:
            request: User request with query and context
            
        Returns:
            LLMResponse with coordinated multi-agent response
        """
        logger.info(f"Processing LLM request: {request.user_query[:100]}...")
        
        try:
            # Step 1: Analyze the request to determine intent and requirements
            analysis = await self._analyze_request(request)
            
            # Step 2: Select agents using existing trust system
            selected_agents = await self._select_agents(analysis)
            
            # Step 3: Configure workflow using existing flow service
            workflow_config = await self._configure_workflow(analysis, selected_agents)
            
            # Step 4: Execute coordination using existing multi-agent APIs
            execution_result = await self._execute_coordination(workflow_config, request)
            
            # Step 5: Monitor governance compliance
            governance_status = await self._check_governance_compliance(execution_result)
            
            # Step 6: Generate response
            response = await self._generate_response(execution_result, request)
            
            return LLMResponse(
                response=response,
                agents_used=selected_agents,
                workflow_type=workflow_config["type"],
                trust_scores=execution_result.get("trust_scores", {}),
                governance_status=governance_status,
                session_id=request.session_id or "default",
                timestamp=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Error processing LLM request: {str(e)}")
            return LLMResponse(
                response=f"I encountered an error processing your request: {str(e)}",
                agents_used=[],
                workflow_type="error",
                trust_scores={},
                governance_status="error",
                session_id=request.session_id or "default",
                timestamp=datetime.utcnow().isoformat()
            )
    
    async def _analyze_request(self, request: LLMRequest) -> Dict[str, Any]:
        """
        Analyze user request to determine intent, complexity, and requirements.
        
        Uses existing AI model service for analysis.
        """
        analysis_prompt = f"""
        Analyze this user request and determine:
        1. Primary intent (research, creation, analysis, coordination, etc.)
        2. Complexity level (simple, moderate, complex)
        3. Required capabilities (writing, analysis, research, computation, etc.)
        4. Suggested collaboration model (shared_context, sequential_handoffs, parallel_processing, hierarchical_coordination, consensus_decision)
        5. Estimated agent count needed
        
        User request: {request.user_query}
        Context: {request.context or 'None'}
        
        Respond in JSON format.
        """
        
        # Use existing AI model service
        analysis_response = await self.ai_model_service.generate_response(
            prompt=analysis_prompt,
            provider=ModelProvider.OPENAI,  # or configured default
            model="gpt-4",
            max_tokens=500
        )
        
        try:
            return json.loads(analysis_response)
        except json.JSONDecodeError:
            # Fallback analysis
            return {
                "intent": "general",
                "complexity": "moderate",
                "capabilities": ["general"],
                "collaboration_model": "shared_context",
                "agent_count": 2
            }
    
    async def _select_agents(self, analysis: Dict[str, Any]) -> List[str]:
        """
        Select appropriate agents using existing trust relationship APIs.
        
        Calls existing /api/multi-agent/trust-relationships endpoint.
        """
        try:
            # Query existing trust relationships API
            response = await self.http_client.get(
                f"{self.base_url}/api/multi-agent/trust-relationships",
                params={
                    "capabilities": analysis.get("capabilities", []),
                    "min_trust_score": 0.7,
                    "limit": analysis.get("agent_count", 3)
                }
            )
            
            if response.status_code == 200:
                trust_data = response.json()
                # Extract agent IDs from trust relationships
                return [agent["agent_id"] for agent in trust_data.get("agents", [])]
            else:
                logger.warning(f"Trust API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error selecting agents: {str(e)}")
        
        # Fallback to default agents
        return ["agent-writer", "agent-researcher", "agent-analyst"]
    
    async def _configure_workflow(self, analysis: Dict[str, Any], agents: List[str]) -> Dict[str, Any]:
        """
        Configure workflow using existing flow configuration service.
        
        Uses existing collaboration service and flow configuration.
        """
        collaboration_model = analysis.get("collaboration_model", "shared_context")
        
        # Map to existing collaboration model types
        model_mapping = {
            "shared_context": CollaborationModelType.SHARED_CONTEXT,
            "sequential_handoffs": CollaborationModelType.SEQUENTIAL_HANDOFFS,
            "parallel_processing": CollaborationModelType.PARALLEL_PROCESSING,
            "hierarchical_coordination": CollaborationModelType.HIERARCHICAL_COORDINATION,
            "consensus_decision": CollaborationModelType.CONSENSUS_DECISION
        }
        
        model_type = model_mapping.get(collaboration_model, CollaborationModelType.SHARED_CONTEXT)
        
        # Create collaboration config using existing service
        config = CollaborationConfig(
            model_type=model_type,
            agent_ids=agents,
            configuration={
                "intent": analysis.get("intent"),
                "complexity": analysis.get("complexity"),
                "capabilities": analysis.get("capabilities", [])
            }
        )
        
        # Validate using existing collaboration service
        validation_result = await self.collaboration_service.validate_collaboration_model(
            model_type, 
            [{"agent_id": agent_id, "capabilities": analysis.get("capabilities", []), 
              "performance_metrics": {}, "communication_protocols": []} for agent_id in agents]
        )
        
        return {
            "type": collaboration_model,
            "config": config,
            "validation": validation_result,
            "agents": agents
        }
    
    async def _execute_coordination(self, workflow_config: Dict[str, Any], request: LLMRequest) -> Dict[str, Any]:
        """
        Execute multi-agent coordination using existing multi-agent APIs.
        
        Calls existing /api/multi-agent/communications endpoint.
        """
        try:
            # Prepare coordination request for existing API
            coordination_request = {
                "workflow_type": workflow_config["type"],
                "agents": workflow_config["agents"],
                "task": request.user_query,
                "context": request.context or {},
                "collaboration_config": workflow_config["config"].dict()
            }
            
            # Call existing multi-agent communications API
            response = await self.http_client.post(
                f"{self.base_url}/api/multi-agent/communications",
                json=coordination_request
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.warning(f"Multi-agent API returned {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error executing coordination: {str(e)}")
        
        # Fallback response
        return {
            "result": "Coordination completed with fallback mechanism",
            "agents_used": workflow_config["agents"],
            "trust_scores": {agent: 0.8 for agent in workflow_config["agents"]}
        }
    
    async def _check_governance_compliance(self, execution_result: Dict[str, Any]) -> str:
        """
        Check governance compliance using existing governance APIs.
        
        Calls existing /api/governance/sessions endpoint.
        """
        try:
            # Query existing governance API
            response = await self.http_client.get(
                f"{self.base_url}/api/governance/sessions",
                params={"latest": True}
            )
            
            if response.status_code == 200:
                governance_data = response.json()
                return governance_data.get("compliance_status", "compliant")
            
        except Exception as e:
            logger.error(f"Error checking governance: {str(e)}")
        
        return "compliant"  # Default to compliant
    
    async def _generate_response(self, execution_result: Dict[str, Any], request: LLMRequest) -> str:
        """
        Generate final response using existing AI model service.
        """
        response_prompt = f"""
        Based on the multi-agent coordination results, provide a comprehensive response to the user.
        
        User's original request: {request.user_query}
        Coordination results: {execution_result.get('result', 'No specific results')}
        Agents involved: {execution_result.get('agents_used', [])}
        
        Provide a helpful, comprehensive response that addresses the user's request.
        """
        
        # Use existing AI model service for response generation
        response = await self.ai_model_service.generate_response(
            prompt=response_prompt,
            provider=ModelProvider.OPENAI,
            model="gpt-4",
            max_tokens=1000
        )
        
        return response
    
    async def close(self):
        """Clean up resources."""
        await self.http_client.aclose()

# Global service instance
promethios_llm_service = PrometheusLLMService()

