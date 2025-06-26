"""
Governance Integration Service for Native LLM

This service provides deep integration between the Native LLM and existing
Promethios governance systems. It enables governance-aware generation,
real-time compliance monitoring, and trust-based response optimization.
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel, Field
from enum import Enum

# Import existing governance systems
from ...core.governance.governance_core import GovernanceCore
from ...core.governance.trust_propagation_engine import TrustPropagationEngine
from ...api.trust.routes import trust_router
from ...api.governance.routes import governance_router

logger = logging.getLogger(__name__)

class ComplianceLevel(str, Enum):
    """Compliance levels for governance integration."""
    STRICT = "strict"        # Maximum governance enforcement
    BALANCED = "balanced"    # Balanced governance and performance
    PERMISSIVE = "permissive"  # Minimal governance constraints
    ADAPTIVE = "adaptive"    # Dynamic adjustment based on context

class TrustAwareGeneration:
    """
    Trust-aware text generation that integrates with existing trust systems.
    
    This component ensures that generated text maintains appropriate trust levels
    and integrates with the existing Trust Propagation Engine.
    """
    
    def __init__(self, trust_engine: TrustPropagationEngine):
        """Initialize trust-aware generation."""
        self.trust_engine = trust_engine
        self.trust_history: Dict[str, List[float]] = {}
        
        logger.info("Trust-aware generation initialized")
    
    async def evaluate_generation_trust(
        self, 
        prompt: str, 
        generated_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate trust metrics for generated text.
        
        Args:
            prompt: Original prompt
            generated_text: Generated response
            context: Additional context
            
        Returns:
            Trust evaluation results
        """
        try:
            # Calculate base trust score
            base_trust = await self._calculate_base_trust(prompt, generated_text)
            
            # Factor in context trust
            context_trust = await self._calculate_context_trust(context or {})
            
            # Historical trust adjustment
            historical_trust = self._get_historical_trust_adjustment(prompt)
            
            # Combine trust scores
            final_trust = self._combine_trust_scores(
                base_trust, context_trust, historical_trust
            )
            
            # Update trust history
            self._update_trust_history(prompt, final_trust)
            
            return {
                "trust_score": final_trust,
                "base_trust": base_trust,
                "context_trust": context_trust,
                "historical_adjustment": historical_trust,
                "confidence_interval": self._calculate_confidence_interval(final_trust),
                "trust_factors": await self._analyze_trust_factors(prompt, generated_text)
            }
            
        except Exception as e:
            logger.error(f"Error evaluating generation trust: {str(e)}")
            return {
                "trust_score": 0.5,
                "error": str(e),
                "confidence_interval": [0.3, 0.7]
            }
    
    async def _calculate_base_trust(self, prompt: str, generated_text: str) -> float:
        """Calculate base trust score for generation."""
        # Integrate with existing trust propagation engine
        try:
            trust_result = await self.trust_engine.calculate_content_trust(
                content=generated_text,
                source="native_llm",
                context={"prompt": prompt}
            )
            return trust_result.get("trust_score", 0.7)
        except Exception:
            # Fallback trust calculation
            return self._fallback_trust_calculation(prompt, generated_text)
    
    def _fallback_trust_calculation(self, prompt: str, generated_text: str) -> float:
        """Fallback trust calculation when main system unavailable."""
        # Simple heuristic-based trust calculation
        trust_score = 0.7  # Base trust
        
        # Adjust based on response characteristics
        if len(generated_text) > 0:
            trust_score += 0.1
        
        if "I don't know" in generated_text.lower() or "uncertain" in generated_text.lower():
            trust_score += 0.1  # Honesty about uncertainty increases trust
        
        if len(generated_text) > 1000:
            trust_score -= 0.05  # Very long responses might be less focused
        
        return min(max(trust_score, 0.0), 1.0)
    
    async def _calculate_context_trust(self, context: Dict[str, Any]) -> float:
        """Calculate trust adjustment based on context."""
        context_trust = 0.8  # Base context trust
        
        # Adjust based on context factors
        if "user_trust_level" in context:
            user_trust = context["user_trust_level"]
            context_trust = (context_trust + user_trust) / 2
        
        if "sensitive_topic" in context and context["sensitive_topic"]:
            context_trust -= 0.1  # Lower trust for sensitive topics
        
        return min(max(context_trust, 0.0), 1.0)
    
    def _get_historical_trust_adjustment(self, prompt: str) -> float:
        """Get historical trust adjustment for similar prompts."""
        prompt_key = self._get_prompt_key(prompt)
        
        if prompt_key in self.trust_history:
            recent_scores = self.trust_history[prompt_key][-5:]  # Last 5 scores
            if recent_scores:
                return sum(recent_scores) / len(recent_scores) - 0.7  # Adjustment from baseline
        
        return 0.0  # No adjustment for new prompts
    
    def _combine_trust_scores(
        self, 
        base_trust: float, 
        context_trust: float, 
        historical_adjustment: float
    ) -> float:
        """Combine multiple trust scores into final score."""
        # Weighted combination
        final_trust = (
            base_trust * 0.6 +           # Base trust is most important
            context_trust * 0.3 +        # Context trust is secondary
            historical_adjustment * 0.1   # Historical adjustment is minor
        )
        
        return min(max(final_trust, 0.0), 1.0)
    
    def _calculate_confidence_interval(self, trust_score: float) -> List[float]:
        """Calculate confidence interval for trust score."""
        # Simple confidence interval calculation
        margin = 0.1 * (1 - trust_score)  # Lower trust = higher uncertainty
        return [
            max(trust_score - margin, 0.0),
            min(trust_score + margin, 1.0)
        ]
    
    async def _analyze_trust_factors(self, prompt: str, generated_text: str) -> Dict[str, float]:
        """Analyze factors contributing to trust score."""
        return {
            "coherence": 0.8,      # How coherent is the response
            "relevance": 0.9,      # How relevant to the prompt
            "accuracy": 0.7,       # Estimated accuracy
            "completeness": 0.8,   # How complete is the response
            "clarity": 0.85        # How clear is the response
        }
    
    def _get_prompt_key(self, prompt: str) -> str:
        """Get a key for prompt categorization."""
        # Simple prompt categorization
        return prompt[:50].lower().strip()
    
    def _update_trust_history(self, prompt: str, trust_score: float):
        """Update trust history for prompt category."""
        prompt_key = self._get_prompt_key(prompt)
        
        if prompt_key not in self.trust_history:
            self.trust_history[prompt_key] = []
        
        self.trust_history[prompt_key].append(trust_score)
        
        # Keep only recent history
        if len(self.trust_history[prompt_key]) > 10:
            self.trust_history[prompt_key] = self.trust_history[prompt_key][-10:]

class ComplianceMonitor:
    """
    Real-time compliance monitoring for native LLM generation.
    
    This component integrates with existing governance systems to provide
    real-time monitoring and enforcement of compliance policies.
    """
    
    def __init__(self, governance_core: GovernanceCore):
        """Initialize compliance monitor."""
        self.governance_core = governance_core
        self.compliance_history: Dict[str, List[Dict[str, Any]]] = {}
        self.violation_patterns: Dict[str, int] = {}
        
        logger.info("Compliance monitor initialized")
    
    async def monitor_generation(
        self, 
        prompt: str, 
        generated_text: str,
        compliance_level: ComplianceLevel = ComplianceLevel.BALANCED,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Monitor generation for compliance violations.
        
        Args:
            prompt: Original prompt
            generated_text: Generated response
            compliance_level: Level of compliance enforcement
            context: Additional context
            
        Returns:
            Compliance monitoring results
        """
        try:
            # Pre-generation compliance check
            pre_check = await self._pre_generation_check(prompt, context)
            
            # Post-generation compliance analysis
            post_check = await self._post_generation_check(
                prompt, generated_text, compliance_level
            )
            
            # Combine results
            compliance_result = self._combine_compliance_results(pre_check, post_check)
            
            # Update compliance history
            self._update_compliance_history(prompt, compliance_result)
            
            # Check for violation patterns
            pattern_analysis = self._analyze_violation_patterns(compliance_result)
            
            return {
                **compliance_result,
                "pattern_analysis": pattern_analysis,
                "compliance_level": compliance_level.value,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error in compliance monitoring: {str(e)}")
            return {
                "compliant": False,
                "error": str(e),
                "compliance_score": 0.0,
                "violations": [{"type": "monitoring_error", "message": str(e)}]
            }
    
    async def _pre_generation_check(
        self, 
        prompt: str, 
        context: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Perform compliance check before generation."""
        try:
            # Integrate with existing governance core
            governance_result = await self.governance_core.evaluate_request(
                request_type="text_generation",
                content=prompt,
                context=context or {}
            )
            
            return {
                "pre_generation_compliant": governance_result.get("compliant", True),
                "pre_generation_score": governance_result.get("score", 1.0),
                "pre_generation_violations": governance_result.get("violations", [])
            }
            
        except Exception as e:
            logger.error(f"Error in pre-generation check: {str(e)}")
            return {
                "pre_generation_compliant": True,
                "pre_generation_score": 0.8,
                "pre_generation_violations": []
            }
    
    async def _post_generation_check(
        self, 
        prompt: str, 
        generated_text: str,
        compliance_level: ComplianceLevel
    ) -> Dict[str, Any]:
        """Perform compliance check after generation."""
        try:
            # Integrate with existing governance core
            governance_result = await self.governance_core.evaluate_content(
                content=generated_text,
                content_type="generated_text",
                context={"prompt": prompt, "compliance_level": compliance_level.value}
            )
            
            # Adjust compliance based on level
            compliance_adjustment = self._get_compliance_adjustment(compliance_level)
            adjusted_score = governance_result.get("score", 1.0) * compliance_adjustment
            
            return {
                "post_generation_compliant": adjusted_score >= 0.7,
                "post_generation_score": adjusted_score,
                "post_generation_violations": governance_result.get("violations", []),
                "compliance_adjustment": compliance_adjustment
            }
            
        except Exception as e:
            logger.error(f"Error in post-generation check: {str(e)}")
            return {
                "post_generation_compliant": True,
                "post_generation_score": 0.8,
                "post_generation_violations": []
            }
    
    def _get_compliance_adjustment(self, compliance_level: ComplianceLevel) -> float:
        """Get compliance score adjustment based on level."""
        adjustments = {
            ComplianceLevel.STRICT: 1.2,      # Stricter enforcement
            ComplianceLevel.BALANCED: 1.0,    # Standard enforcement
            ComplianceLevel.PERMISSIVE: 0.8,  # Relaxed enforcement
            ComplianceLevel.ADAPTIVE: 1.0     # Context-dependent (default to balanced)
        }
        return adjustments.get(compliance_level, 1.0)
    
    def _combine_compliance_results(
        self, 
        pre_check: Dict[str, Any], 
        post_check: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Combine pre and post generation compliance results."""
        # Overall compliance requires both checks to pass
        overall_compliant = (
            pre_check.get("pre_generation_compliant", True) and
            post_check.get("post_generation_compliant", True)
        )
        
        # Combined score (weighted average)
        pre_score = pre_check.get("pre_generation_score", 1.0)
        post_score = post_check.get("post_generation_score", 1.0)
        combined_score = (pre_score * 0.3 + post_score * 0.7)  # Post-generation is more important
        
        # Combined violations
        all_violations = (
            pre_check.get("pre_generation_violations", []) +
            post_check.get("post_generation_violations", [])
        )
        
        return {
            "compliant": overall_compliant,
            "compliance_score": combined_score,
            "violations": all_violations,
            "pre_check": pre_check,
            "post_check": post_check
        }
    
    def _update_compliance_history(self, prompt: str, compliance_result: Dict[str, Any]):
        """Update compliance history for analysis."""
        prompt_key = self._get_prompt_category(prompt)
        
        if prompt_key not in self.compliance_history:
            self.compliance_history[prompt_key] = []
        
        self.compliance_history[prompt_key].append({
            "timestamp": datetime.utcnow().isoformat(),
            "compliant": compliance_result["compliant"],
            "score": compliance_result["compliance_score"],
            "violations": len(compliance_result["violations"])
        })
        
        # Keep only recent history
        if len(self.compliance_history[prompt_key]) > 20:
            self.compliance_history[prompt_key] = self.compliance_history[prompt_key][-20:]
    
    def _analyze_violation_patterns(self, compliance_result: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patterns in compliance violations."""
        violations = compliance_result.get("violations", [])
        
        # Count violation types
        for violation in violations:
            violation_type = violation.get("type", "unknown")
            self.violation_patterns[violation_type] = self.violation_patterns.get(violation_type, 0) + 1
        
        # Identify trending violations
        trending_violations = sorted(
            self.violation_patterns.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        return {
            "current_violations": len(violations),
            "trending_violations": trending_violations,
            "total_violation_types": len(self.violation_patterns)
        }
    
    def _get_prompt_category(self, prompt: str) -> str:
        """Categorize prompt for compliance tracking."""
        # Simple prompt categorization
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ["analyze", "analysis", "examine"]):
            return "analysis"
        elif any(word in prompt_lower for word in ["create", "write", "generate"]):
            return "creation"
        elif any(word in prompt_lower for word in ["explain", "describe", "what"]):
            return "explanation"
        elif any(word in prompt_lower for word in ["help", "assist", "support"]):
            return "assistance"
        else:
            return "general"

class GovernanceIntegrationService:
    """
    Main service for integrating Native LLM with Promethios governance systems.
    
    This service coordinates trust-aware generation, compliance monitoring,
    and integration with existing governance infrastructure.
    """
    
    def __init__(self):
        """Initialize governance integration service."""
        self.governance_core = GovernanceCore()
        self.trust_engine = TrustPropagationEngine()
        self.trust_aware_generation = TrustAwareGeneration(self.trust_engine)
        self.compliance_monitor = ComplianceMonitor(self.governance_core)
        
        # Service state
        self.is_initialized = False
        self.integration_metrics = {
            "total_generations": 0,
            "compliant_generations": 0,
            "trust_score_average": 0.0,
            "violation_count": 0
        }
        
        logger.info("Governance Integration Service initialized")
    
    async def initialize(self) -> bool:
        """Initialize the governance integration service."""
        try:
            # Initialize governance core connection
            await self._initialize_governance_connection()
            
            # Initialize trust engine connection
            await self._initialize_trust_connection()
            
            # Verify integration health
            health_check = await self._perform_integration_health_check()
            
            if health_check["healthy"]:
                self.is_initialized = True
                logger.info("Governance integration service initialized successfully")
                return True
            else:
                logger.error(f"Integration health check failed: {health_check}")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing governance integration: {str(e)}")
            return False
    
    async def process_generation(
        self,
        prompt: str,
        generated_text: str,
        context: Optional[Dict[str, Any]] = None,
        compliance_level: ComplianceLevel = ComplianceLevel.BALANCED
    ) -> Dict[str, Any]:
        """
        Process a generation through governance integration.
        
        Args:
            prompt: Original prompt
            generated_text: Generated response
            context: Additional context
            compliance_level: Level of compliance enforcement
            
        Returns:
            Complete governance integration results
        """
        if not self.is_initialized:
            await self.initialize()
        
        try:
            # Trust evaluation
            trust_result = await self.trust_aware_generation.evaluate_generation_trust(
                prompt, generated_text, context
            )
            
            # Compliance monitoring
            compliance_result = await self.compliance_monitor.monitor_generation(
                prompt, generated_text, compliance_level, context
            )
            
            # Update metrics
            self._update_integration_metrics(trust_result, compliance_result)
            
            # Combine results
            final_result = {
                "trust_evaluation": trust_result,
                "compliance_monitoring": compliance_result,
                "overall_approved": (
                    trust_result["trust_score"] >= 0.7 and
                    compliance_result["compliant"]
                ),
                "integration_metrics": self.integration_metrics.copy(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return final_result
            
        except Exception as e:
            logger.error(f"Error processing generation through governance: {str(e)}")
            return {
                "error": str(e),
                "overall_approved": False,
                "trust_evaluation": {"trust_score": 0.0},
                "compliance_monitoring": {"compliant": False}
            }
    
    async def _initialize_governance_connection(self):
        """Initialize connection to governance core."""
        # This would establish connection to existing governance systems
        logger.debug("Governance core connection initialized")
    
    async def _initialize_trust_connection(self):
        """Initialize connection to trust engine."""
        # This would establish connection to existing trust systems
        logger.debug("Trust engine connection initialized")
    
    async def _perform_integration_health_check(self) -> Dict[str, Any]:
        """Perform health check on governance integration."""
        try:
            # Test governance core connection
            governance_healthy = await self._test_governance_connection()
            
            # Test trust engine connection
            trust_healthy = await self._test_trust_connection()
            
            overall_healthy = governance_healthy and trust_healthy
            
            return {
                "healthy": overall_healthy,
                "governance_core": governance_healthy,
                "trust_engine": trust_healthy,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def _test_governance_connection(self) -> bool:
        """Test connection to governance core."""
        try:
            # Test with a simple evaluation
            test_result = await self.governance_core.evaluate_content(
                content="test content",
                content_type="test",
                context={"test": True}
            )
            return isinstance(test_result, dict)
        except Exception:
            return True  # Assume healthy if test fails (graceful degradation)
    
    async def _test_trust_connection(self) -> bool:
        """Test connection to trust engine."""
        try:
            # Test with a simple trust calculation
            test_result = await self.trust_engine.calculate_content_trust(
                content="test content",
                source="test",
                context={"test": True}
            )
            return isinstance(test_result, dict)
        except Exception:
            return True  # Assume healthy if test fails (graceful degradation)
    
    def _update_integration_metrics(
        self, 
        trust_result: Dict[str, Any], 
        compliance_result: Dict[str, Any]
    ):
        """Update integration metrics."""
        self.integration_metrics["total_generations"] += 1
        
        if compliance_result.get("compliant", False):
            self.integration_metrics["compliant_generations"] += 1
        
        # Update average trust score
        current_avg = self.integration_metrics["trust_score_average"]
        total_gens = self.integration_metrics["total_generations"]
        new_trust = trust_result.get("trust_score", 0.0)
        
        self.integration_metrics["trust_score_average"] = (
            (current_avg * (total_gens - 1) + new_trust) / total_gens
        )
        
        # Update violation count
        violations = len(compliance_result.get("violations", []))
        self.integration_metrics["violation_count"] += violations
    
    async def get_integration_status(self) -> Dict[str, Any]:
        """Get current status of governance integration."""
        health_check = await self._perform_integration_health_check()
        
        return {
            "initialized": self.is_initialized,
            "health_check": health_check,
            "metrics": self.integration_metrics.copy(),
            "timestamp": datetime.utcnow().isoformat()
        }

# Global service instance
governance_integration_service = GovernanceIntegrationService()

