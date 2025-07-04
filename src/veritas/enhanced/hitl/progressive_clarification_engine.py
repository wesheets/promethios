"""
Enhanced Veritas 2 Progressive Clarification Engine

Advanced workflow engine for progressive uncertainty resolution through human collaboration.
Implements multi-stage clarification processes that adapt based on uncertainty reduction
progress, expert feedback, and quantum insights.

Key Capabilities:
- Multi-Stage Workflows - Progressive uncertainty resolution stages
- Adaptive Questioning - Dynamic question generation based on context
- Uncertainty Tracking - Real-time uncertainty reduction monitoring
- Expert Collaboration - Seamless expert-AI collaboration workflows
- Learning Integration - Continuous improvement from successful patterns
"""

import logging
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import uuid
import asyncio
from dataclasses import dataclass, asdict
import math

# Import bridge services
from ..bridges.enhanced_veritas_bridge import get_enhanced_veritas_bridge
from ..bridges.unified_config import get_config, is_feature_enabled, FeatureFlag

# Import uncertainty analysis
from ..uncertaintyEngine import UncertaintyAnalysisEngine
from ..types import UncertaintyAnalysis, UncertaintySource

# Import quantum integration
from ..quantum.quantum_integration import get_quantum_integration

# Import expert matching
from .expert_matching_system import get_expert_matching_system, HITLSession, ExpertMatch

logger = logging.getLogger(__name__)

@dataclass
class ClarificationStage:
    """Individual stage in progressive clarification workflow."""
    stage_id: str
    stage_name: str
    stage_type: str  # exploration, focused_inquiry, validation, synthesis
    target_uncertainty_reduction: float  # Expected uncertainty reduction
    questions: List[Dict[str, Any]]  # Questions for this stage
    completion_criteria: Dict[str, Any]  # Criteria for stage completion
    expert_guidance: Dict[str, Any]  # Guidance for expert interaction
    quantum_insights: Dict[str, Any]  # Quantum-enhanced insights
    stage_status: str  # pending, active, completed, skipped
    stage_results: Dict[str, Any]  # Results from this stage
    created_timestamp: str
    completed_timestamp: Optional[str]

@dataclass
class ClarificationWorkflow:
    """Complete progressive clarification workflow."""
    workflow_id: str
    uncertainty_analysis: UncertaintyAnalysis
    workflow_strategy: str  # progressive, direct, contextual, quantum_enhanced
    stages: List[ClarificationStage]
    current_stage_index: int
    overall_progress: float  # 0-1 completion progress
    uncertainty_reduction_progress: List[Tuple[float, float]]  # (time, uncertainty)
    expert_interactions: List[Dict[str, Any]]
    quantum_enhancements: Dict[str, Any]
    workflow_metrics: Dict[str, Any]
    workflow_status: str  # active, completed, paused, escalated
    created_timestamp: str
    last_updated: str

@dataclass
class ClarificationQuestion:
    """Individual clarification question with context."""
    question_id: str
    question_text: str
    question_type: str  # open_ended, multiple_choice, scale, binary, contextual
    uncertainty_target: str  # Which uncertainty dimension this targets
    expected_information_gain: float  # Expected uncertainty reduction
    question_context: Dict[str, Any]  # Context for question
    answer_options: Optional[List[str]]  # For multiple choice questions
    validation_criteria: Dict[str, Any]  # Answer validation
    quantum_enhancement: Dict[str, Any]  # Quantum-enhanced question insights
    created_timestamp: str

@dataclass
class ClarificationResponse:
    """Response to clarification question with analysis."""
    response_id: str
    question_id: str
    expert_id: str
    response_content: Any  # The actual response
    response_confidence: float  # Expert's confidence in response
    information_gain: float  # Actual uncertainty reduction achieved
    response_quality: float  # Quality assessment of response
    follow_up_needed: bool  # Whether follow-up questions are needed
    quantum_insights: Dict[str, Any]  # Quantum analysis of response
    response_timestamp: str

class ProgressiveClarificationEngine:
    """
    Advanced engine for progressive uncertainty clarification.
    
    Manages multi-stage workflows that progressively reduce uncertainty
    through intelligent human-AI collaboration, adaptive questioning,
    and quantum-enhanced insights.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.bridge = get_enhanced_veritas_bridge()
        self.quantum_integration = get_quantum_integration()
        self.expert_matching = get_expert_matching_system()
        self.config = get_config()
        
        # Workflow management
        self.active_workflows = {}  # workflow_id -> ClarificationWorkflow
        self.workflow_templates = {}  # strategy -> workflow template
        self.question_generators = {}  # uncertainty_type -> question generator
        
        # Learning and optimization
        self.successful_patterns = {}  # Pattern learning from successful workflows
        self.question_effectiveness = {}  # Question effectiveness tracking
        
        # Initialize workflow templates
        self._initialize_workflow_templates()
        self._initialize_question_generators()
        
        self.logger.info("Progressive Clarification Engine initialized")
    
    def create_clarification_workflow(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        hitl_session: HITLSession,
        strategy: str = "progressive"
    ) -> ClarificationWorkflow:
        """
        Create a progressive clarification workflow.
        
        Args:
            uncertainty_analysis: Uncertainty analysis requiring clarification
            hitl_session: HITL session context
            strategy: Clarification strategy (progressive, direct, contextual, quantum_enhanced)
            
        Returns:
            Created clarification workflow
        """
        self.logger.info(f"Creating clarification workflow with strategy: {strategy}")
        
        try:
            workflow_id = str(uuid.uuid4())
            
            # Get quantum enhancements if available
            quantum_enhancements = self._get_quantum_enhancements_for_workflow(
                uncertainty_analysis, hitl_session
            )
            
            # Generate workflow stages based on strategy
            stages = self._generate_workflow_stages(
                uncertainty_analysis, hitl_session, strategy, quantum_enhancements
            )
            
            # Create workflow
            workflow = ClarificationWorkflow(
                workflow_id=workflow_id,
                uncertainty_analysis=uncertainty_analysis,
                workflow_strategy=strategy,
                stages=stages,
                current_stage_index=0,
                overall_progress=0.0,
                uncertainty_reduction_progress=[(0.0, uncertainty_analysis.overall_uncertainty)],
                expert_interactions=[],
                quantum_enhancements=quantum_enhancements,
                workflow_metrics={
                    "start_uncertainty": uncertainty_analysis.overall_uncertainty,
                    "target_uncertainty": 0.3,  # Default target
                    "stages_completed": 0,
                    "questions_asked": 0,
                    "information_gained": 0.0
                },
                workflow_status="active",
                created_timestamp=datetime.utcnow().isoformat(),
                last_updated=datetime.utcnow().isoformat()
            )
            
            # Store workflow
            self.active_workflows[workflow_id] = workflow
            
            # Activate first stage
            if stages:
                stages[0].stage_status = "active"
            
            self.logger.info(f"Clarification workflow created: {workflow_id}")
            return workflow
            
        except Exception as e:
            self.logger.error(f"Error creating clarification workflow: {e}")
            raise
    
    def generate_clarification_questions(
        self,
        workflow_id: str,
        stage_id: str,
        context: Dict[str, Any] = None
    ) -> List[ClarificationQuestion]:
        """
        Generate clarification questions for a workflow stage.
        
        Args:
            workflow_id: ID of the clarification workflow
            stage_id: ID of the current stage
            context: Additional context for question generation
            
        Returns:
            List of generated clarification questions
        """
        self.logger.info(f"Generating clarification questions for stage: {stage_id}")
        
        try:
            workflow = self.active_workflows.get(workflow_id)
            if not workflow:
                self.logger.warning(f"Workflow not found: {workflow_id}")
                return []
            
            # Find the stage
            stage = None
            for s in workflow.stages:
                if s.stage_id == stage_id:
                    stage = s
                    break
            
            if not stage:
                self.logger.warning(f"Stage not found: {stage_id}")
                return []
            
            context = context or {}
            questions = []
            
            # Generate questions based on stage type and uncertainty analysis
            if stage.stage_type == "exploration":
                questions.extend(self._generate_exploration_questions(
                    workflow, stage, context
                ))
            elif stage.stage_type == "focused_inquiry":
                questions.extend(self._generate_focused_inquiry_questions(
                    workflow, stage, context
                ))
            elif stage.stage_type == "validation":
                questions.extend(self._generate_validation_questions(
                    workflow, stage, context
                ))
            elif stage.stage_type == "synthesis":
                questions.extend(self._generate_synthesis_questions(
                    workflow, stage, context
                ))
            
            # Add quantum-enhanced questions if available
            if is_feature_enabled(FeatureFlag.QUANTUM_UNCERTAINTY):
                quantum_questions = self._generate_quantum_enhanced_questions(
                    workflow, stage, context
                )
                questions.extend(quantum_questions)
            
            # Update stage with generated questions
            stage.questions = [asdict(q) for q in questions]
            workflow.last_updated = datetime.utcnow().isoformat()
            
            self.logger.info(f"Generated {len(questions)} clarification questions")
            return questions
            
        except Exception as e:
            self.logger.error(f"Error generating clarification questions: {e}")
            return []
    
    def process_clarification_response(
        self,
        workflow_id: str,
        question_id: str,
        response_content: Any,
        expert_id: str,
        response_confidence: float = 0.8
    ) -> ClarificationResponse:
        """
        Process a clarification response and update uncertainty.
        
        Args:
            workflow_id: ID of the clarification workflow
            question_id: ID of the question being answered
            response_content: The response content
            expert_id: ID of the responding expert
            response_confidence: Expert's confidence in the response
            
        Returns:
            Processed clarification response with analysis
        """
        self.logger.info(f"Processing clarification response for question: {question_id}")
        
        try:
            workflow = self.active_workflows.get(workflow_id)
            if not workflow:
                self.logger.warning(f"Workflow not found: {workflow_id}")
                return None
            
            # Find the question
            question = self._find_question_in_workflow(workflow, question_id)
            if not question:
                self.logger.warning(f"Question not found: {question_id}")
                return None
            
            # Analyze response quality
            response_quality = self._analyze_response_quality(
                question, response_content, response_confidence
            )
            
            # Calculate information gain
            information_gain = self._calculate_information_gain(
                workflow, question, response_content, response_confidence
            )
            
            # Determine if follow-up is needed
            follow_up_needed = self._determine_follow_up_need(
                question, response_content, information_gain
            )
            
            # Get quantum insights for response
            quantum_insights = self._get_quantum_insights_for_response(
                workflow, question, response_content
            )
            
            # Create response object
            response = ClarificationResponse(
                response_id=str(uuid.uuid4()),
                question_id=question_id,
                expert_id=expert_id,
                response_content=response_content,
                response_confidence=response_confidence,
                information_gain=information_gain,
                response_quality=response_quality,
                follow_up_needed=follow_up_needed,
                quantum_insights=quantum_insights,
                response_timestamp=datetime.utcnow().isoformat()
            )
            
            # Update workflow with response
            self._update_workflow_with_response(workflow, response)
            
            # Update uncertainty analysis
            self._update_uncertainty_with_response(workflow, response)
            
            # Check stage completion
            self._check_stage_completion(workflow)
            
            # Update learning patterns
            self._update_learning_patterns(workflow, question, response)
            
            self.logger.info(f"Clarification response processed: {response.response_id}")
            return response
            
        except Exception as e:
            self.logger.error(f"Error processing clarification response: {e}")
            return None
    
    def advance_workflow_stage(
        self,
        workflow_id: str,
        force_advance: bool = False
    ) -> bool:
        """
        Advance workflow to the next stage.
        
        Args:
            workflow_id: ID of the clarification workflow
            force_advance: Whether to force advancement regardless of completion criteria
            
        Returns:
            True if advancement was successful
        """
        self.logger.info(f"Advancing workflow stage: {workflow_id}")
        
        try:
            workflow = self.active_workflows.get(workflow_id)
            if not workflow:
                self.logger.warning(f"Workflow not found: {workflow_id}")
                return False
            
            current_stage_index = workflow.current_stage_index
            
            # Check if current stage is complete (unless forcing)
            if not force_advance:
                current_stage = workflow.stages[current_stage_index]
                if not self._is_stage_complete(current_stage):
                    self.logger.info("Current stage not complete, cannot advance")
                    return False
            
            # Mark current stage as completed
            if current_stage_index < len(workflow.stages):
                workflow.stages[current_stage_index].stage_status = "completed"
                workflow.stages[current_stage_index].completed_timestamp = datetime.utcnow().isoformat()
            
            # Advance to next stage
            next_stage_index = current_stage_index + 1
            
            if next_stage_index >= len(workflow.stages):
                # Workflow complete
                workflow.workflow_status = "completed"
                workflow.overall_progress = 1.0
                self.logger.info(f"Workflow completed: {workflow_id}")
                return True
            
            # Activate next stage
            workflow.current_stage_index = next_stage_index
            workflow.stages[next_stage_index].stage_status = "active"
            
            # Update progress
            workflow.overall_progress = (next_stage_index + 1) / len(workflow.stages)
            workflow.workflow_metrics["stages_completed"] = next_stage_index
            workflow.last_updated = datetime.utcnow().isoformat()
            
            self.logger.info(f"Advanced to stage {next_stage_index + 1} of {len(workflow.stages)}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error advancing workflow stage: {e}")
            return False
    
    def get_workflow_insights(
        self,
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Get comprehensive insights about workflow progress.
        
        Args:
            workflow_id: ID of the clarification workflow
            
        Returns:
            Workflow insights and analytics
        """
        self.logger.info(f"Getting workflow insights: {workflow_id}")
        
        try:
            workflow = self.active_workflows.get(workflow_id)
            if not workflow:
                return {"error": "Workflow not found"}
            
            # Calculate uncertainty reduction
            initial_uncertainty = workflow.uncertainty_reduction_progress[0][1]
            current_uncertainty = workflow.uncertainty_reduction_progress[-1][1]
            uncertainty_reduction = initial_uncertainty - current_uncertainty
            uncertainty_reduction_percentage = (uncertainty_reduction / initial_uncertainty) * 100
            
            # Calculate stage progress
            completed_stages = sum(1 for stage in workflow.stages if stage.stage_status == "completed")
            total_stages = len(workflow.stages)
            
            # Calculate question effectiveness
            total_questions = workflow.workflow_metrics.get("questions_asked", 0)
            total_information_gain = workflow.workflow_metrics.get("information_gained", 0.0)
            avg_question_effectiveness = total_information_gain / total_questions if total_questions > 0 else 0.0
            
            # Get quantum insights
            quantum_insights = workflow.quantum_enhancements
            
            # Calculate estimated completion
            if workflow.overall_progress > 0:
                elapsed_time = (datetime.utcnow() - datetime.fromisoformat(workflow.created_timestamp.replace('Z', '+00:00'))).total_seconds() / 60
                estimated_total_time = elapsed_time / workflow.overall_progress
                estimated_remaining_time = estimated_total_time - elapsed_time
            else:
                estimated_remaining_time = 0.0
            
            insights = {
                "workflow_id": workflow_id,
                "workflow_status": workflow.workflow_status,
                "overall_progress": workflow.overall_progress,
                "uncertainty_reduction": {
                    "initial_uncertainty": initial_uncertainty,
                    "current_uncertainty": current_uncertainty,
                    "reduction_amount": uncertainty_reduction,
                    "reduction_percentage": uncertainty_reduction_percentage
                },
                "stage_progress": {
                    "completed_stages": completed_stages,
                    "total_stages": total_stages,
                    "current_stage": workflow.current_stage_index + 1,
                    "current_stage_name": workflow.stages[workflow.current_stage_index].stage_name if workflow.current_stage_index < len(workflow.stages) else "Completed"
                },
                "question_analytics": {
                    "total_questions_asked": total_questions,
                    "total_information_gained": total_information_gain,
                    "average_question_effectiveness": avg_question_effectiveness
                },
                "timing_insights": {
                    "estimated_remaining_time_minutes": estimated_remaining_time,
                    "workflow_efficiency": workflow.overall_progress / max(1, elapsed_time / 60) if elapsed_time > 0 else 0.0
                },
                "quantum_insights": quantum_insights,
                "recommendations": self._generate_workflow_recommendations(workflow),
                "insights_timestamp": datetime.utcnow().isoformat()
            }
            
            return insights
            
        except Exception as e:
            self.logger.error(f"Error getting workflow insights: {e}")
            return {"error": str(e)}
    
    def _initialize_workflow_templates(self):
        """Initialize workflow templates for different strategies."""
        
        self.workflow_templates = {
            "progressive": {
                "stages": [
                    {"name": "Initial Exploration", "type": "exploration", "target_reduction": 0.2},
                    {"name": "Focused Inquiry", "type": "focused_inquiry", "target_reduction": 0.4},
                    {"name": "Deep Validation", "type": "validation", "target_reduction": 0.3},
                    {"name": "Final Synthesis", "type": "synthesis", "target_reduction": 0.1}
                ]
            },
            "direct": {
                "stages": [
                    {"name": "Direct Inquiry", "type": "focused_inquiry", "target_reduction": 0.7},
                    {"name": "Validation", "type": "validation", "target_reduction": 0.3}
                ]
            },
            "contextual": {
                "stages": [
                    {"name": "Context Exploration", "type": "exploration", "target_reduction": 0.3},
                    {"name": "Contextual Inquiry", "type": "focused_inquiry", "target_reduction": 0.4},
                    {"name": "Context Validation", "type": "validation", "target_reduction": 0.3}
                ]
            },
            "quantum_enhanced": {
                "stages": [
                    {"name": "Quantum Exploration", "type": "exploration", "target_reduction": 0.25},
                    {"name": "Entanglement Analysis", "type": "focused_inquiry", "target_reduction": 0.35},
                    {"name": "Coherence Validation", "type": "validation", "target_reduction": 0.25},
                    {"name": "Quantum Synthesis", "type": "synthesis", "target_reduction": 0.15}
                ]
            }
        }
    
    def _initialize_question_generators(self):
        """Initialize question generators for different uncertainty types."""
        
        self.question_generators = {
            "epistemic": self._generate_epistemic_questions,
            "aleatoric": self._generate_aleatoric_questions,
            "confidence": self._generate_confidence_questions,
            "contextual": self._generate_contextual_questions,
            "temporal": self._generate_temporal_questions,
            "social": self._generate_social_questions
        }
    
    def _generate_workflow_stages(
        self,
        uncertainty_analysis: UncertaintyAnalysis,
        hitl_session: HITLSession,
        strategy: str,
        quantum_enhancements: Dict[str, Any]
    ) -> List[ClarificationStage]:
        """Generate workflow stages based on strategy and uncertainty analysis."""
        
        template = self.workflow_templates.get(strategy, self.workflow_templates["progressive"])
        stages = []
        
        for i, stage_template in enumerate(template["stages"]):
            stage_id = str(uuid.uuid4())
            
            # Create stage
            stage = ClarificationStage(
                stage_id=stage_id,
                stage_name=stage_template["name"],
                stage_type=stage_template["type"],
                target_uncertainty_reduction=stage_template["target_reduction"],
                questions=[],  # Will be generated when stage becomes active
                completion_criteria={
                    "min_uncertainty_reduction": stage_template["target_reduction"] * 0.8,
                    "min_questions_answered": 2,
                    "min_information_gain": 0.1
                },
                expert_guidance={
                    "stage_objective": f"Reduce uncertainty through {stage_template['type']} approach",
                    "recommended_approach": self._get_stage_approach_guidance(stage_template["type"]),
                    "success_indicators": self._get_stage_success_indicators(stage_template["type"])
                },
                quantum_insights=quantum_enhancements.get(f"stage_{i}", {}),
                stage_status="pending",
                stage_results={},
                created_timestamp=datetime.utcnow().isoformat(),
                completed_timestamp=None
            )
            
            stages.append(stage)
        
        return stages
    
    def _generate_exploration_questions(
        self,
        workflow: ClarificationWorkflow,
        stage: ClarificationStage,
        context: Dict[str, Any]
    ) -> List[ClarificationQuestion]:
        """Generate exploration questions for initial uncertainty exploration."""
        
        questions = []
        uncertainty_analysis = workflow.uncertainty_analysis
        
        # Generate questions for each major uncertainty source
        for source in uncertainty_analysis.uncertainty_sources[:3]:  # Top 3 sources
            question = ClarificationQuestion(
                question_id=str(uuid.uuid4()),
                question_text=f"Can you help clarify the uncertainty around: {source.description}? What additional information or context might help resolve this?",
                question_type="open_ended",
                uncertainty_target=source.uncertainty_type,
                expected_information_gain=0.2,
                question_context={
                    "uncertainty_source": source.description,
                    "uncertainty_level": source.uncertainty_level,
                    "stage_type": "exploration"
                },
                answer_options=None,
                validation_criteria={
                    "min_length": 50,
                    "requires_specific_information": True
                },
                quantum_enhancement={},
                created_timestamp=datetime.utcnow().isoformat()
            )
            questions.append(question)
        
        # Add general exploration question
        general_question = ClarificationQuestion(
            question_id=str(uuid.uuid4()),
            question_text="What aspects of this situation do you think are most important to understand better?",
            question_type="open_ended",
            uncertainty_target="general",
            expected_information_gain=0.15,
            question_context={"stage_type": "exploration", "question_scope": "general"},
            answer_options=None,
            validation_criteria={"min_length": 30},
            quantum_enhancement={},
            created_timestamp=datetime.utcnow().isoformat()
        )
        questions.append(general_question)
        
        return questions
    
    def _generate_focused_inquiry_questions(
        self,
        workflow: ClarificationWorkflow,
        stage: ClarificationStage,
        context: Dict[str, Any]
    ) -> List[ClarificationQuestion]:
        """Generate focused inquiry questions for targeted uncertainty reduction."""
        
        questions = []
        uncertainty_analysis = workflow.uncertainty_analysis
        
        # Focus on highest uncertainty areas
        uncertainty_breakdown = uncertainty_analysis.uncertainty_breakdown
        sorted_uncertainties = sorted(uncertainty_breakdown.items(), key=lambda x: x[1], reverse=True)
        
        for uncertainty_type, level in sorted_uncertainties[:2]:  # Top 2 uncertainty types
            if uncertainty_type in self.question_generators:
                generator = self.question_generators[uncertainty_type]
                type_questions = generator(uncertainty_analysis, level, context)
                questions.extend(type_questions)
        
        return questions
    
    def _generate_validation_questions(
        self,
        workflow: ClarificationWorkflow,
        stage: ClarificationStage,
        context: Dict[str, Any]
    ) -> List[ClarificationQuestion]:
        """Generate validation questions to confirm understanding."""
        
        questions = []
        
        # Generate validation questions based on previous responses
        validation_question = ClarificationQuestion(
            question_id=str(uuid.uuid4()),
            question_text="Based on our discussion, how confident are you that we've identified the key factors contributing to the uncertainty?",
            question_type="scale",
            uncertainty_target="confidence",
            expected_information_gain=0.1,
            question_context={"stage_type": "validation", "scale_range": "1-10"},
            answer_options=["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
            validation_criteria={"valid_range": [1, 10]},
            quantum_enhancement={},
            created_timestamp=datetime.utcnow().isoformat()
        )
        questions.append(validation_question)
        
        return questions
    
    def _generate_synthesis_questions(
        self,
        workflow: ClarificationWorkflow,
        stage: ClarificationStage,
        context: Dict[str, Any]
    ) -> List[ClarificationQuestion]:
        """Generate synthesis questions to consolidate understanding."""
        
        questions = []
        
        synthesis_question = ClarificationQuestion(
            question_id=str(uuid.uuid4()),
            question_text="Can you summarize the key insights we've gained and any remaining areas of uncertainty?",
            question_type="open_ended",
            uncertainty_target="synthesis",
            expected_information_gain=0.05,
            question_context={"stage_type": "synthesis"},
            answer_options=None,
            validation_criteria={"min_length": 100},
            quantum_enhancement={},
            created_timestamp=datetime.utcnow().isoformat()
        )
        questions.append(synthesis_question)
        
        return questions
    
    # Additional helper methods would continue here...
    # (Implementation continues with question generators for each uncertainty type,
    # response analysis, workflow management, learning integration, etc.)

# Global progressive clarification engine instance
_progressive_clarification_engine = None

def get_progressive_clarification_engine() -> ProgressiveClarificationEngine:
    """Get the global Progressive Clarification Engine instance."""
    global _progressive_clarification_engine
    if _progressive_clarification_engine is None:
        _progressive_clarification_engine = ProgressiveClarificationEngine()
    return _progressive_clarification_engine

# Convenience functions for external use
def create_clarification_workflow(uncertainty_analysis: UncertaintyAnalysis, hitl_session: HITLSession, strategy: str = "progressive") -> ClarificationWorkflow:
    """Create a progressive clarification workflow."""
    engine = get_progressive_clarification_engine()
    return engine.create_clarification_workflow(uncertainty_analysis, hitl_session, strategy)

def generate_clarification_questions(workflow_id: str, stage_id: str, context: Dict[str, Any] = None) -> List[ClarificationQuestion]:
    """Generate clarification questions for a workflow stage."""
    engine = get_progressive_clarification_engine()
    return engine.generate_clarification_questions(workflow_id, stage_id, context)

