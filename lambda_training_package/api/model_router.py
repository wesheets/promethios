"""
Governance Model Router
Routes requests to appropriate governance AI models based on domain and availability
"""

from typing import Dict, Any, Optional, List
import logging
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)

class GovernanceModelRouter:
    """
    Router for governance AI models
    Manages multiple governance models and routes requests to the most appropriate one
    """
    
    def __init__(self, model_configs: Dict[str, Any]):
        """
        Initialize the model router
        
        Args:
            model_configs: Configuration for available models
        """
        self.model_configs = model_configs
        self.loaded_models = {}
        self.model_capabilities = {
            "ultimate_governance": {
                "domains": ["constitutional", "operational", "crisis", "ethical", "compliance", "stakeholder"],
                "priority": 1,
                "performance_score": 77.22
            },
            "constitutional_governance": {
                "domains": ["constitutional", "legal", "policy", "compliance"],
                "priority": 2,
                "performance_score": 85.0  # Estimated based on specialization
            },
            "operational_governance": {
                "domains": ["operational", "process", "resource", "performance"],
                "priority": 3,
                "performance_score": 82.0  # Estimated based on specialization
            }
        }
    
    async def initialize(self):
        """Initialize available models"""
        logger.info("Initializing governance models...")
        
        for model_name, config in self.model_configs.items():
            if config.get("enabled", False):
                try:
                    await self._load_model(model_name, config)
                except Exception as e:
                    logger.error(f"Failed to load model {model_name}: {e}")
        
        logger.info(f"Initialized {len(self.loaded_models)} governance models")
    
    async def _load_model(self, model_name: str, config: Dict[str, Any]):
        """Load a specific model"""
        model_path = config["path"]
        
        if not Path(model_path).exists():
            logger.warning(f"Model path does not exist: {model_path}")
            return
        
        try:
            if model_name == "ultimate_governance":
                from ..models.ultimate_governance_llm import UltimateGovernanceLLMLoader
                loader = UltimateGovernanceLLMLoader(model_path)
                await asyncio.get_event_loop().run_in_executor(None, loader.load_model)
                self.loaded_models[model_name] = loader
                logger.info(f"Loaded Ultimate Governance LLM from {model_path}")
            
            elif model_name == "constitutional_governance":
                # Placeholder for constitutional governance model
                # Will be implemented when the model is available
                logger.info(f"Constitutional Governance model placeholder loaded")
            
            elif model_name == "operational_governance":
                # Placeholder for operational governance model
                # Will be implemented when the model is available
                logger.info(f"Operational Governance model placeholder loaded")
            
        except Exception as e:
            logger.error(f"Error loading {model_name}: {e}")
            raise
    
    async def select_best_model(self, domain: Optional[str] = None) -> str:
        """
        Select the best model for a given domain
        
        Args:
            domain: Governance domain (constitutional, operational, etc.)
            
        Returns:
            Name of the best model for the domain
        """
        if not self.loaded_models:
            raise RuntimeError("No models are currently loaded")
        
        if not domain:
            # Return the highest priority loaded model
            available_models = [
                (name, self.model_capabilities[name]["priority"])
                for name in self.loaded_models.keys()
                if name in self.model_capabilities
            ]
            if available_models:
                return min(available_models, key=lambda x: x[1])[0]
        
        # Find models that support the domain
        suitable_models = []
        for model_name in self.loaded_models.keys():
            if model_name in self.model_capabilities:
                capabilities = self.model_capabilities[model_name]
                if domain in capabilities["domains"]:
                    suitable_models.append((
                        model_name,
                        capabilities["priority"],
                        capabilities["performance_score"]
                    ))
        
        if suitable_models:
            # Sort by priority (lower is better), then by performance score (higher is better)
            suitable_models.sort(key=lambda x: (x[1], -x[2]))
            return suitable_models[0][0]
        
        # Fallback to ultimate governance if available
        if "ultimate_governance" in self.loaded_models:
            return "ultimate_governance"
        
        # Return any available model
        return list(self.loaded_models.keys())[0]
    
    async def analyze(self, model_name: str, scenario: str, domain: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Perform governance analysis using specified model
        
        Args:
            model_name: Name of the model to use
            scenario: Governance scenario to analyze
            domain: Governance domain
            **kwargs: Additional parameters
            
        Returns:
            Analysis result
        """
        if model_name not in self.loaded_models:
            raise ValueError(f"Model {model_name} is not loaded")
        
        model = self.loaded_models[model_name]
        
        try:
            if hasattr(model, 'generate_response'):
                # Format prompt for analysis
                prompt = self._format_analysis_prompt(scenario, domain)
                response = model.generate_response(
                    prompt=prompt,
                    governance_domain=domain,
                    **kwargs
                )
                
                return {
                    "model": model_name,
                    "scenario": scenario,
                    "domain": domain,
                    "analysis": response,
                    "timestamp": self._get_timestamp()
                }
            else:
                raise NotImplementedError(f"Model {model_name} does not support analysis")
                
        except Exception as e:
            logger.error(f"Error in analysis with {model_name}: {e}")
            raise
    
    async def evaluate(self, model_name: str, decision: str, criteria: Optional[List[str]] = None, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform governance evaluation using specified model
        
        Args:
            model_name: Name of the model to use
            decision: Decision to evaluate
            criteria: Evaluation criteria
            domain: Governance domain
            
        Returns:
            Evaluation result
        """
        if model_name not in self.loaded_models:
            raise ValueError(f"Model {model_name} is not loaded")
        
        model = self.loaded_models[model_name]
        
        try:
            if hasattr(model, 'generate_response'):
                # Format prompt for evaluation
                prompt = self._format_evaluation_prompt(decision, criteria, domain)
                response = model.generate_response(
                    prompt=prompt,
                    governance_domain=domain
                )
                
                return {
                    "model": model_name,
                    "decision": decision,
                    "criteria": criteria,
                    "domain": domain,
                    "evaluation": response,
                    "timestamp": self._get_timestamp()
                }
            else:
                raise NotImplementedError(f"Model {model_name} does not support evaluation")
                
        except Exception as e:
            logger.error(f"Error in evaluation with {model_name}: {e}")
            raise
    
    async def recommend(self, model_name: str, scenario: str, domain: Optional[str] = None) -> Dict[str, Any]:
        """
        Get governance recommendations using specified model
        
        Args:
            model_name: Name of the model to use
            scenario: Scenario for recommendations
            domain: Governance domain
            
        Returns:
            Recommendations result
        """
        if model_name not in self.loaded_models:
            raise ValueError(f"Model {model_name} is not loaded")
        
        model = self.loaded_models[model_name]
        
        try:
            if hasattr(model, 'generate_response'):
                # Format prompt for recommendations
                prompt = self._format_recommendation_prompt(scenario, domain)
                response = model.generate_response(
                    prompt=prompt,
                    governance_domain=domain
                )
                
                return {
                    "model": model_name,
                    "scenario": scenario,
                    "domain": domain,
                    "recommendations": response,
                    "timestamp": self._get_timestamp()
                }
            else:
                raise NotImplementedError(f"Model {model_name} does not support recommendations")
                
        except Exception as e:
            logger.error(f"Error in recommendations with {model_name}: {e}")
            raise
    
    async def get_available_models(self) -> Dict[str, Any]:
        """Get list of available models"""
        return {
            "loaded_models": list(self.loaded_models.keys()),
            "configured_models": list(self.model_configs.keys()),
            "model_capabilities": self.model_capabilities
        }
    
    async def get_model_status(self) -> Dict[str, Any]:
        """Get status of all models"""
        status = {}
        for model_name, config in self.model_configs.items():
            status[model_name] = {
                "configured": True,
                "enabled": config.get("enabled", False),
                "loaded": model_name in self.loaded_models,
                "path": config.get("path"),
                "capabilities": self.model_capabilities.get(model_name, {})
            }
        return status
    
    async def get_model_info(self, model_name: str) -> Dict[str, Any]:
        """Get information about a specific model"""
        if model_name not in self.loaded_models:
            raise ValueError(f"Model {model_name} is not loaded")
        
        model = self.loaded_models[model_name]
        
        if hasattr(model, 'get_model_info'):
            return model.get_model_info()
        else:
            return {
                "model_name": model_name,
                "status": "loaded",
                "capabilities": self.model_capabilities.get(model_name, {})
            }
    
    def _format_analysis_prompt(self, scenario: str, domain: Optional[str] = None) -> str:
        """Format prompt for governance analysis"""
        prompt_parts = ["<ASSESSMENT>"]
        
        if domain:
            prompt_parts.append(f"<{domain.upper()}>")
        
        prompt_parts.extend([
            f"Analyze the following governance scenario: {scenario}",
            "Provide a comprehensive analysis including:",
            "1. Stakeholder impact assessment",
            "2. Risk evaluation",
            "3. Compliance considerations", 
            "4. Specific recommendations",
            "5. Implementation framework"
        ])
        
        return " ".join(prompt_parts)
    
    def _format_evaluation_prompt(self, decision: str, criteria: Optional[List[str]] = None, domain: Optional[str] = None) -> str:
        """Format prompt for governance evaluation"""
        prompt_parts = ["<EVALUATION>"]
        
        if domain:
            prompt_parts.append(f"<{domain.upper()}>")
        
        prompt_parts.append(f"Evaluate the following governance decision: {decision}")
        
        if criteria:
            prompt_parts.append(f"Evaluation criteria: {', '.join(criteria)}")
        
        prompt_parts.extend([
            "Provide a detailed evaluation including:",
            "1. Overall governance score (0-100)",
            "2. Strengths and weaknesses",
            "3. Risk assessment",
            "4. Improvement recommendations"
        ])
        
        return " ".join(prompt_parts)
    
    def _format_recommendation_prompt(self, scenario: str, domain: Optional[str] = None) -> str:
        """Format prompt for governance recommendations"""
        prompt_parts = ["<RECOMMENDATION>"]
        
        if domain:
            prompt_parts.append(f"<{domain.upper()}>")
        
        prompt_parts.extend([
            f"Provide governance recommendations for: {scenario}",
            "Include:",
            "1. Immediate actions",
            "2. Long-term strategies", 
            "3. Risk mitigation",
            "4. Stakeholder engagement",
            "5. Success metrics"
        ])
        
        return " ".join(prompt_parts)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"
    
    async def cleanup(self):
        """Cleanup loaded models"""
        logger.info("Cleaning up governance models...")
        
        for model_name, model in self.loaded_models.items():
            try:
                if hasattr(model, 'unload_model'):
                    model.unload_model()
                logger.info(f"Cleaned up {model_name}")
            except Exception as e:
                logger.error(f"Error cleaning up {model_name}: {e}")
        
        self.loaded_models.clear()
        logger.info("Model cleanup completed")

