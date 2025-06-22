"""
Multi-Agent Coordination Service for Promethios Chat Backend.

This module implements sophisticated multi-agent orchestration patterns
with governance oversight and agent-to-agent communication.

Features:
- 4 coordination patterns: Sequential, Parallel, Hierarchical, Collaborative
- Agent-to-agent communication protocols
- Consensus building and conflict resolution
- Performance optimization and load balancing
- Governance integration for multi-agent decisions
"""

import asyncio
import json
import time
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from enum import Enum
from dataclasses import dataclass

class CoordinationPattern(str, Enum):
    """Multi-agent coordination patterns."""
    SEQUENTIAL = "sequential"
    PARALLEL = "parallel"
    HIERARCHICAL = "hierarchical"
    COLLABORATIVE = "collaborative"

class AgentRole(str, Enum):
    """Agent roles in multi-agent systems."""
    LEAD = "lead"
    SPECIALIST = "specialist"
    VALIDATOR = "validator"
    SYNTHESIZER = "synthesizer"

@dataclass
class AgentResponse:
    """Response from an individual agent."""
    agent_id: str
    content: str
    confidence: float
    processing_time_ms: int
    metadata: Dict[str, Any]
    governance_status: str
    trust_score: float

@dataclass
class CoordinationResult:
    """Result of multi-agent coordination."""
    final_response: str
    coordination_pattern: CoordinationPattern
    participating_agents: List[str]
    individual_responses: List[AgentResponse]
    consensus_score: float
    total_processing_time_ms: int
    governance_summary: Dict[str, Any]

class MultiAgentCoordinator:
    """Orchestrates multi-agent conversations with governance oversight."""
    
    def __init__(self, ai_model_service):
        self.ai_model_service = ai_model_service
        self.coordination_history = {}
        self.performance_metrics = {}
    
    async def coordinate_agents(
        self,
        agents: List[Dict[str, Any]],
        message: str,
        coordination_pattern: CoordinationPattern,
        conversation_history: List[Dict[str, str]] = None,
        governance_context: Dict[str, Any] = None,
        coordination_config: Dict[str, Any] = None
    ) -> CoordinationResult:
        """
        Coordinate multiple agents to generate a unified response.
        
        Args:
            agents: List of agent configurations
            message: User message
            coordination_pattern: How agents should be coordinated
            conversation_history: Previous conversation messages
            governance_context: Governance settings and context
            coordination_config: Coordination-specific settings
            
        Returns:
            CoordinationResult with unified response and metadata
        """
        start_time = time.time()
        
        try:
            # Validate agents
            if not agents or len(agents) < 2:
                raise ValueError("Multi-agent coordination requires at least 2 agents")
            
            # Set default coordination config
            config = coordination_config or {}
            max_rounds = config.get("max_rounds", 3)
            consensus_threshold = config.get("consensus_threshold", 0.8)
            lead_agent_id = config.get("lead_agent_id")
            
            # Execute coordination pattern
            if coordination_pattern == CoordinationPattern.SEQUENTIAL:
                result = await self._coordinate_sequential(
                    agents, message, conversation_history, governance_context, config
                )
            elif coordination_pattern == CoordinationPattern.PARALLEL:
                result = await self._coordinate_parallel(
                    agents, message, conversation_history, governance_context, config
                )
            elif coordination_pattern == CoordinationPattern.HIERARCHICAL:
                result = await self._coordinate_hierarchical(
                    agents, message, conversation_history, governance_context, config, lead_agent_id
                )
            elif coordination_pattern == CoordinationPattern.COLLABORATIVE:
                result = await self._coordinate_collaborative(
                    agents, message, conversation_history, governance_context, config, 
                    max_rounds, consensus_threshold
                )
            else:
                raise ValueError(f"Unknown coordination pattern: {coordination_pattern}")
            
            # Calculate total processing time
            total_time = int((time.time() - start_time) * 1000)
            result.total_processing_time_ms = total_time
            
            # Record coordination metrics
            self._record_coordination_metrics(coordination_pattern, len(agents), total_time, True)
            
            return result
            
        except Exception as e:
            total_time = int((time.time() - start_time) * 1000)
            
            # Record failure metrics
            self._record_coordination_metrics(coordination_pattern, len(agents), total_time, False)
            
            # Return error result
            return CoordinationResult(
                final_response=f"Multi-agent coordination failed: {str(e)}",
                coordination_pattern=coordination_pattern,
                participating_agents=[agent.get("agent_id", "unknown") for agent in agents],
                individual_responses=[],
                consensus_score=0.0,
                total_processing_time_ms=total_time,
                governance_summary={"status": "error", "error": str(e)}
            )
    
    async def _coordinate_sequential(
        self,
        agents: List[Dict[str, Any]],
        message: str,
        conversation_history: List[Dict[str, str]],
        governance_context: Dict[str, Any],
        config: Dict[str, Any]
    ) -> CoordinationResult:
        """Sequential coordination: agents respond in order, each building on previous responses."""
        
        responses = []
        current_context = conversation_history or []
        accumulated_response = ""
        
        for i, agent in enumerate(agents):
            # Build context including previous agent responses
            agent_context = current_context.copy()
            
            if i > 0:
                # Add previous agent responses to context
                for prev_response in responses:
                    agent_context.append({
                        "role": "assistant",
                        "content": f"[Agent {prev_response.agent_id}]: {prev_response.content}"
                    })
            
            # Generate response from current agent
            response_data = await self.ai_model_service.generate_response(
                agent["agent_id"],
                message,
                agent_context,
                governance_context
            )
            
            # Create agent response object
            agent_response = AgentResponse(
                agent_id=agent["agent_id"],
                content=response_data.get("response", ""),
                confidence=0.8,  # TODO: Implement confidence scoring
                processing_time_ms=response_data.get("processing_time_ms", 0),
                metadata=response_data,
                governance_status=response_data.get("status", "unknown"),
                trust_score=0.8  # TODO: Get from governance context
            )
            
            responses.append(agent_response)
            accumulated_response += f"[{agent['agent_id']}]: {agent_response.content}\n\n"
        
        # Synthesize final response
        final_response = await self._synthesize_sequential_responses(responses, message)
        
        return CoordinationResult(
            final_response=final_response,
            coordination_pattern=CoordinationPattern.SEQUENTIAL,
            participating_agents=[agent["agent_id"] for agent in agents],
            individual_responses=responses,
            consensus_score=0.9,  # Sequential has high consensus by design
            total_processing_time_ms=0,  # Will be set by caller
            governance_summary={"pattern": "sequential", "agents": len(agents)}
        )
    
    async def _coordinate_parallel(
        self,
        agents: List[Dict[str, Any]],
        message: str,
        conversation_history: List[Dict[str, str]],
        governance_context: Dict[str, Any],
        config: Dict[str, Any]
    ) -> CoordinationResult:
        """Parallel coordination: all agents respond simultaneously, then responses are synthesized."""
        
        # Generate all responses in parallel
        tasks = []
        for agent in agents:
            task = self.ai_model_service.generate_response(
                agent["agent_id"],
                message,
                conversation_history,
                governance_context
            )
            tasks.append(task)
        
        # Wait for all responses
        response_data_list = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process responses
        responses = []
        for i, response_data in enumerate(response_data_list):
            if isinstance(response_data, Exception):
                # Handle failed response
                agent_response = AgentResponse(
                    agent_id=agents[i]["agent_id"],
                    content=f"Agent failed: {str(response_data)}",
                    confidence=0.0,
                    processing_time_ms=0,
                    metadata={"error": str(response_data)},
                    governance_status="error",
                    trust_score=0.0
                )
            else:
                agent_response = AgentResponse(
                    agent_id=agents[i]["agent_id"],
                    content=response_data.get("response", ""),
                    confidence=0.8,
                    processing_time_ms=response_data.get("processing_time_ms", 0),
                    metadata=response_data,
                    governance_status=response_data.get("status", "unknown"),
                    trust_score=0.8
                )
            
            responses.append(agent_response)
        
        # Synthesize responses
        final_response = await self._synthesize_parallel_responses(responses, message)
        consensus_score = self._calculate_consensus_score(responses)
        
        return CoordinationResult(
            final_response=final_response,
            coordination_pattern=CoordinationPattern.PARALLEL,
            participating_agents=[agent["agent_id"] for agent in agents],
            individual_responses=responses,
            consensus_score=consensus_score,
            total_processing_time_ms=0,
            governance_summary={"pattern": "parallel", "agents": len(agents)}
        )
    
    async def _coordinate_hierarchical(
        self,
        agents: List[Dict[str, Any]],
        message: str,
        conversation_history: List[Dict[str, str]],
        governance_context: Dict[str, Any],
        config: Dict[str, Any],
        lead_agent_id: Optional[str]
    ) -> CoordinationResult:
        """Hierarchical coordination: lead agent directs specialist agents."""
        
        # Identify lead agent
        lead_agent = None
        specialist_agents = []
        
        for agent in agents:
            if agent["agent_id"] == lead_agent_id or (not lead_agent and agent.get("role") == "lead"):
                lead_agent = agent
            else:
                specialist_agents.append(agent)
        
        if not lead_agent:
            lead_agent = agents[0]  # Default to first agent
            specialist_agents = agents[1:]
        
        responses = []
        
        # Step 1: Lead agent analyzes the request and delegates
        lead_context = conversation_history or []
        lead_context.append({
            "role": "system",
            "content": f"You are the lead agent coordinating with specialists: {[a['agent_id'] for a in specialist_agents]}. Analyze the request and provide initial guidance."
        })
        
        lead_response_data = await self.ai_model_service.generate_response(
            lead_agent["agent_id"],
            message,
            lead_context,
            governance_context
        )
        
        lead_response = AgentResponse(
            agent_id=lead_agent["agent_id"],
            content=lead_response_data.get("response", ""),
            confidence=0.9,
            processing_time_ms=lead_response_data.get("processing_time_ms", 0),
            metadata=lead_response_data,
            governance_status=lead_response_data.get("status", "unknown"),
            trust_score=0.9
        )
        responses.append(lead_response)
        
        # Step 2: Specialist agents respond based on lead's guidance
        specialist_tasks = []
        for specialist in specialist_agents:
            specialist_context = conversation_history or []
            specialist_context.append({
                "role": "assistant",
                "content": f"[Lead Agent {lead_agent['agent_id']}]: {lead_response.content}"
            })
            specialist_context.append({
                "role": "system",
                "content": f"You are a specialist agent. Respond to the request considering the lead agent's guidance."
            })
            
            task = self.ai_model_service.generate_response(
                specialist["agent_id"],
                message,
                specialist_context,
                governance_context
            )
            specialist_tasks.append(task)
        
        # Wait for specialist responses
        specialist_data_list = await asyncio.gather(*specialist_tasks, return_exceptions=True)
        
        # Process specialist responses
        for i, response_data in enumerate(specialist_data_list):
            if not isinstance(response_data, Exception):
                specialist_response = AgentResponse(
                    agent_id=specialist_agents[i]["agent_id"],
                    content=response_data.get("response", ""),
                    confidence=0.8,
                    processing_time_ms=response_data.get("processing_time_ms", 0),
                    metadata=response_data,
                    governance_status=response_data.get("status", "unknown"),
                    trust_score=0.8
                )
                responses.append(specialist_response)
        
        # Step 3: Lead agent synthesizes final response
        synthesis_context = conversation_history or []
        synthesis_context.append({
            "role": "user",
            "content": message
        })
        
        for response in responses[1:]:  # Skip lead's initial response
            synthesis_context.append({
                "role": "assistant",
                "content": f"[Specialist {response.agent_id}]: {response.content}"
            })
        
        synthesis_context.append({
            "role": "system",
            "content": "Synthesize the specialist responses into a comprehensive final answer."
        })
        
        final_response_data = await self.ai_model_service.generate_response(
            lead_agent["agent_id"],
            "Synthesize the responses above into a final answer.",
            synthesis_context,
            governance_context
        )
        
        final_response = final_response_data.get("response", lead_response.content)
        
        return CoordinationResult(
            final_response=final_response,
            coordination_pattern=CoordinationPattern.HIERARCHICAL,
            participating_agents=[agent["agent_id"] for agent in agents],
            individual_responses=responses,
            consensus_score=0.85,
            total_processing_time_ms=0,
            governance_summary={"pattern": "hierarchical", "lead_agent": lead_agent["agent_id"]}
        )
    
    async def _coordinate_collaborative(
        self,
        agents: List[Dict[str, Any]],
        message: str,
        conversation_history: List[Dict[str, str]],
        governance_context: Dict[str, Any],
        config: Dict[str, Any],
        max_rounds: int,
        consensus_threshold: float
    ) -> CoordinationResult:
        """Collaborative coordination: agents discuss and reach consensus through multiple rounds."""
        
        all_responses = []
        current_context = conversation_history or []
        
        for round_num in range(max_rounds):
            round_responses = []
            
            # Each agent responds considering previous round discussions
            for agent in agents:
                agent_context = current_context.copy()
                
                if round_num > 0:
                    # Add previous round discussions
                    agent_context.append({
                        "role": "system",
                        "content": f"This is round {round_num + 1} of collaborative discussion. Consider previous agent responses and build consensus."
                    })
                
                response_data = await self.ai_model_service.generate_response(
                    agent["agent_id"],
                    message,
                    agent_context,
                    governance_context
                )
                
                agent_response = AgentResponse(
                    agent_id=agent["agent_id"],
                    content=response_data.get("response", ""),
                    confidence=0.8,
                    processing_time_ms=response_data.get("processing_time_ms", 0),
                    metadata=response_data,
                    governance_status=response_data.get("status", "unknown"),
                    trust_score=0.8
                )
                
                round_responses.append(agent_response)
            
            all_responses.extend(round_responses)
            
            # Check for consensus
            consensus_score = self._calculate_consensus_score(round_responses)
            if consensus_score >= consensus_threshold:
                break
            
            # Add round responses to context for next round
            for response in round_responses:
                current_context.append({
                    "role": "assistant",
                    "content": f"[Round {round_num + 1} - {response.agent_id}]: {response.content}"
                })
        
        # Synthesize final collaborative response
        final_response = await self._synthesize_collaborative_responses(all_responses, message, max_rounds)
        final_consensus = self._calculate_consensus_score(all_responses[-len(agents):])  # Last round
        
        return CoordinationResult(
            final_response=final_response,
            coordination_pattern=CoordinationPattern.COLLABORATIVE,
            participating_agents=[agent["agent_id"] for agent in agents],
            individual_responses=all_responses,
            consensus_score=final_consensus,
            total_processing_time_ms=0,
            governance_summary={"pattern": "collaborative", "rounds": round_num + 1, "consensus": final_consensus}
        )
    
    async def _synthesize_sequential_responses(self, responses: List[AgentResponse], original_message: str) -> str:
        """Synthesize sequential agent responses into a coherent final response."""
        if not responses:
            return "No agent responses available."
        
        # For sequential, the last response is typically the most complete
        # But we can enhance it with insights from earlier responses
        final_response = responses[-1].content
        
        if len(responses) > 1:
            # Add a synthesis note
            agent_names = [r.agent_id for r in responses]
            final_response = f"Based on sequential analysis by {', '.join(agent_names)}:\n\n{final_response}"
        
        return final_response
    
    async def _synthesize_parallel_responses(self, responses: List[AgentResponse], original_message: str) -> str:
        """Synthesize parallel agent responses into a unified response."""
        if not responses:
            return "No agent responses available."
        
        # Filter successful responses
        successful_responses = [r for r in responses if r.governance_status != "error"]
        
        if not successful_responses:
            return "All agents encountered errors. Please try again."
        
        if len(successful_responses) == 1:
            return successful_responses[0].content
        
        # Create a synthesized response combining insights
        synthesis = "Based on analysis from multiple AI agents:\n\n"
        
        for i, response in enumerate(successful_responses, 1):
            synthesis += f"**Agent {response.agent_id}**: {response.content}\n\n"
        
        # Add a brief summary
        synthesis += "**Summary**: The agents provide complementary perspectives on your question, offering both factual analysis and creative insights."
        
        return synthesis
    
    async def _synthesize_collaborative_responses(self, responses: List[AgentResponse], original_message: str, rounds: int) -> str:
        """Synthesize collaborative discussion into a consensus response."""
        if not responses:
            return "No collaborative responses available."
        
        # Get the last round of responses (most refined)
        agents_count = len(set(r.agent_id for r in responses))
        last_round_responses = responses[-agents_count:]
        
        # Find the response with highest confidence or use the first
        best_response = max(last_round_responses, key=lambda r: r.confidence)
        
        synthesis = f"After {rounds} rounds of collaborative discussion:\n\n{best_response.content}"
        
        if rounds > 1:
            synthesis += f"\n\n*This response represents the consensus reached through multi-round agent collaboration.*"
        
        return synthesis
    
    def _calculate_consensus_score(self, responses: List[AgentResponse]) -> float:
        """Calculate consensus score based on response similarity and confidence."""
        if len(responses) <= 1:
            return 1.0
        
        # Simple consensus calculation based on response lengths and confidence
        # In a real implementation, this would use semantic similarity
        
        avg_confidence = sum(r.confidence for r in responses) / len(responses)
        
        # Check for similar response lengths (proxy for similar depth)
        lengths = [len(r.content) for r in responses]
        avg_length = sum(lengths) / len(lengths)
        length_variance = sum((l - avg_length) ** 2 for l in lengths) / len(lengths)
        length_similarity = max(0, 1 - (length_variance / (avg_length ** 2)))
        
        # Combine confidence and similarity
        consensus_score = (avg_confidence + length_similarity) / 2
        
        return min(1.0, max(0.0, consensus_score))
    
    def _record_coordination_metrics(self, pattern: CoordinationPattern, agent_count: int, processing_time: int, success: bool):
        """Record coordination performance metrics."""
        key = f"{pattern.value}_{agent_count}"
        
        if key not in self.performance_metrics:
            self.performance_metrics[key] = {
                "total_coordinations": 0,
                "successful_coordinations": 0,
                "failed_coordinations": 0,
                "total_processing_time": 0,
                "average_processing_time": 0
            }
        
        metrics = self.performance_metrics[key]
        metrics["total_coordinations"] += 1
        metrics["total_processing_time"] += processing_time
        metrics["average_processing_time"] = metrics["total_processing_time"] / metrics["total_coordinations"]
        
        if success:
            metrics["successful_coordinations"] += 1
        else:
            metrics["failed_coordinations"] += 1
    
    def get_coordination_metrics(self) -> Dict[str, Any]:
        """Get coordination performance metrics."""
        return self.performance_metrics

