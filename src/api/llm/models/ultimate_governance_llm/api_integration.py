"""
Ultimate Governance LLM API Integration
Extension module for exposing the Ultimate Governance LLM via REST API
"""

from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import asyncio
import logging
import time
from datetime import datetime
from .model_loader import UltimateGovernanceLLMLoader

logger = logging.getLogger(__name__)

# Request/Response Models
class GovernanceAnalysisRequest(BaseModel):
    """Request model for governance analysis"""
    scenario: str = Field(..., description="Governance scenario to analyze")
    domain: Optional[str] = Field(None, description="Specific governance domain (constitutional, operational, crisis, etc.)")
    stakeholders: Optional[List[str]] = Field(None, description="List of stakeholders involved")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context information")
    max_length: Optional[int] = Field(1024, description="Maximum response length")
    temperature: Optional[float] = Field(0.7, description="Response creativity (0.0-1.0)")

class GovernanceAnalysisResponse(BaseModel):
    """Response model for governance analysis"""
    analysis: str = Field(..., description="Governance analysis and recommendations")
    domain: str = Field(..., description="Identified governance domain")
    confidence: float = Field(..., description="Confidence score (0.0-1.0)")
    stakeholder_impact: Dict[str, str] = Field(..., description="Impact assessment for each stakeholder")
    recommendations: List[str] = Field(..., description="Specific governance recommendations")
    compliance_notes: List[str] = Field(..., description="Compliance considerations")
    timestamp: str = Field(..., description="Analysis timestamp")
    processing_time: float = Field(..., description="Processing time in seconds")

class GovernanceEvaluationRequest(BaseModel):
    """Request model for governance evaluation"""
    decision: str = Field(..., description="Governance decision to evaluate")
    criteria: Optional[List[str]] = Field(None, description="Evaluation criteria")
    domain: Optional[str] = Field(None, description="Governance domain")

class GovernanceEvaluationResponse(BaseModel):
    """Response model for governance evaluation"""
    evaluation: str = Field(..., description="Detailed evaluation")
    score: float = Field(..., description="Overall governance score (0.0-100.0)")
    strengths: List[str] = Field(..., description="Identified strengths")
    weaknesses: List[str] = Field(..., description="Areas for improvement")
    risk_assessment: str = Field(..., description="Risk assessment")
    timestamp: str = Field(..., description="Evaluation timestamp")

class UltimateGovernanceAPI:
    """
    API integration class for Ultimate Governance LLM
    Provides REST endpoints for governance analysis and evaluation
    """
    
    def __init__(self, model_path: str):
        """
        Initialize the Ultimate Governance API
        
        Args:
            model_path: Path to the Ultimate Governance LLM model
        """
        self.model_path = model_path
        self.model_loader = None
        self.app = FastAPI(
            title="Ultimate Governance LLM API",
            description="AI-powered governance analysis and decision support",
            version="1.0.0"
        )
        self._setup_routes()
        
    def _setup_routes(self):
        """Setup API routes"""
        
        @self.app.on_event("startup")
        async def startup_event():
            """Load model on startup"""
            await self.load_model()
        
        @self.app.on_event("shutdown")
        async def shutdown_event():
            """Cleanup on shutdown"""
            if self.model_loader:
                self.model_loader.unload_model()
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "model_loaded": self.model_loader is not None,
                "timestamp": datetime.utcnow().isoformat()
            }
        
        @self.app.get("/info")
        async def model_info():
            """Get model information"""
            if not self.model_loader:
                raise HTTPException(status_code=503, detail="Model not loaded")
            
            return self.model_loader.get_model_info()
        
        @self.app.post("/analyze", response_model=GovernanceAnalysisResponse)
        async def analyze_governance(request: GovernanceAnalysisRequest):
            """Analyze governance scenario"""
            if not self.model_loader:
                raise HTTPException(status_code=503, detail="Model not loaded")
            
            start_time = time.time()
            
            try:
                # Generate governance analysis
                analysis = self.model_loader.generate_response(
                    prompt=self._format_analysis_prompt(request),
                    max_length=request.max_length,
                    temperature=request.temperature,
                    governance_domain=request.domain
                )
                
                # Parse and structure the response
                structured_response = self._parse_governance_analysis(
                    analysis, request, time.time() - start_time
                )
                
                return structured_response
                
            except Exception as e:
                logger.error(f"Error in governance analysis: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/evaluate", response_model=GovernanceEvaluationResponse)
        async def evaluate_governance(request: GovernanceEvaluationRequest):
            """Evaluate governance decision"""
            if not self.model_loader:
                raise HTTPException(status_code=503, detail="Model not loaded")
            
            try:
                # Generate governance evaluation
                evaluation = self.model_loader.generate_response(
                    prompt=self._format_evaluation_prompt(request),
                    governance_domain=request.domain
                )
                
                # Parse and structure the response
                structured_response = self._parse_governance_evaluation(evaluation, request)
                
                return structured_response
                
            except Exception as e:
                logger.error(f"Error in governance evaluation: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/recommend")
        async def recommend_governance(scenario: str, domain: Optional[str] = None):
            """Get governance recommendations"""
            if not self.model_loader:
                raise HTTPException(status_code=503, detail="Model not loaded")
            
            try:
                prompt = f"<RECOMMENDATION> Provide governance recommendations for: {scenario}"
                recommendations = self.model_loader.generate_response(
                    prompt=prompt,
                    governance_domain=domain
                )
                
                return {
                    "scenario": scenario,
                    "recommendations": recommendations,
                    "domain": domain or "general",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
            except Exception as e:
                logger.error(f"Error in governance recommendations: {e}")
                raise HTTPException(status_code=500, detail=str(e))
    
    async def load_model(self):
        """Load the Ultimate Governance LLM model"""
        try:
            logger.info("Loading Ultimate Governance LLM...")
            self.model_loader = UltimateGovernanceLLMLoader(self.model_path)
            await asyncio.get_event_loop().run_in_executor(
                None, self.model_loader.load_model
            )
            logger.info("Ultimate Governance LLM loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def _format_analysis_prompt(self, request: GovernanceAnalysisRequest) -> str:
        """Format prompt for governance analysis"""
        prompt_parts = ["<ASSESSMENT>"]
        
        if request.domain:
            prompt_parts.append(f"<{request.domain.upper()}>")
        
        prompt_parts.append(f"Analyze the following governance scenario: {request.scenario}")
        
        if request.stakeholders:
            prompt_parts.append(f"Stakeholders involved: {', '.join(request.stakeholders)}")
        
        if request.context:
            context_str = ", ".join([f"{k}: {v}" for k, v in request.context.items()])
            prompt_parts.append(f"Additional context: {context_str}")
        
        prompt_parts.extend([
            "Provide a comprehensive governance analysis including:",
            "1. Stakeholder impact assessment",
            "2. Risk evaluation", 
            "3. Compliance considerations",
            "4. Specific recommendations",
            "5. Implementation framework"
        ])
        
        return " ".join(prompt_parts)
    
    def _format_evaluation_prompt(self, request: GovernanceEvaluationRequest) -> str:
        """Format prompt for governance evaluation"""
        prompt_parts = ["<EVALUATION>"]
        
        if request.domain:
            prompt_parts.append(f"<{request.domain.upper()}>")
        
        prompt_parts.append(f"Evaluate the following governance decision: {request.decision}")
        
        if request.criteria:
            prompt_parts.append(f"Evaluation criteria: {', '.join(request.criteria)}")
        
        prompt_parts.extend([
            "Provide a detailed evaluation including:",
            "1. Overall governance score (0-100)",
            "2. Strengths and weaknesses",
            "3. Risk assessment",
            "4. Improvement recommendations"
        ])
        
        return " ".join(prompt_parts)
    
    def _parse_governance_analysis(self, analysis: str, request: GovernanceAnalysisRequest, processing_time: float) -> GovernanceAnalysisResponse:
        """Parse and structure governance analysis response"""
        # Extract key components from the analysis
        # This is a simplified parser - in production, you'd want more sophisticated NLP
        
        lines = analysis.split('\n')
        recommendations = []
        compliance_notes = []
        stakeholder_impact = {}
        
        for line in lines:
            line = line.strip()
            if line.startswith('- ') or line.startswith('• '):
                recommendations.append(line[2:])
            elif 'compliance' in line.lower():
                compliance_notes.append(line)
        
        # Default stakeholder impact if stakeholders provided
        if request.stakeholders:
            for stakeholder in request.stakeholders:
                stakeholder_impact[stakeholder] = "Impact assessment pending detailed analysis"
        
        return GovernanceAnalysisResponse(
            analysis=analysis,
            domain=request.domain or "general",
            confidence=0.85,  # Default confidence - could be calculated based on model certainty
            stakeholder_impact=stakeholder_impact,
            recommendations=recommendations[:5] if recommendations else ["Detailed analysis required"],
            compliance_notes=compliance_notes[:3] if compliance_notes else ["Standard compliance review recommended"],
            timestamp=datetime.utcnow().isoformat(),
            processing_time=processing_time
        )
    
    def _parse_governance_evaluation(self, evaluation: str, request: GovernanceEvaluationRequest) -> GovernanceEvaluationResponse:
        """Parse and structure governance evaluation response"""
        # Extract score, strengths, and weaknesses
        # This is a simplified parser
        
        lines = evaluation.split('\n')
        strengths = []
        weaknesses = []
        score = 75.0  # Default score
        
        for line in lines:
            line = line.strip()
            if 'strength' in line.lower() or 'positive' in line.lower():
                strengths.append(line)
            elif 'weakness' in line.lower() or 'concern' in line.lower():
                weaknesses.append(line)
            elif any(word in line.lower() for word in ['score', 'rating', '%']):
                # Try to extract numerical score
                import re
                numbers = re.findall(r'\d+\.?\d*', line)
                if numbers:
                    score = float(numbers[0])
        
        return GovernanceEvaluationResponse(
            evaluation=evaluation,
            score=min(100.0, max(0.0, score)),
            strengths=strengths[:3] if strengths else ["Evaluation in progress"],
            weaknesses=weaknesses[:3] if weaknesses else ["No major concerns identified"],
            risk_assessment="Standard governance risk profile",
            timestamp=datetime.utcnow().isoformat()
        )

# Factory function for creating the API
def create_governance_api(model_path: str) -> FastAPI:
    """
    Factory function to create Ultimate Governance API
    
    Args:
        model_path: Path to the Ultimate Governance LLM model
        
    Returns:
        Configured FastAPI application
    """
    api = UltimateGovernanceAPI(model_path)
    return api.app

# Extension metadata for API integration
API_EXTENSION_INFO = {
    "name": "ultimate_governance_api",
    "version": "1.0.0",
    "type": "governance_ai_api",
    "description": "REST API for Ultimate Governance LLM",
    "endpoints": [
        "/health",
        "/info", 
        "/analyze",
        "/evaluate",
        "/recommend"
    ],
    "dependencies": [
        "fastapi>=0.100.0",
        "pydantic>=2.0.0",
        "uvicorn>=0.23.0"
    ]
}

