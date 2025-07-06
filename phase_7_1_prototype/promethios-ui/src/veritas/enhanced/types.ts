/**
 * Enhanced Veritas 2 Type Definitions
 * 
 * Extended type definitions for Enhanced Veritas 2 system including uncertainty analysis,
 * human-in-the-loop collaboration, multi-agent orchestration, and quantum uncertainty modeling.
 */

import { VerificationResult, ClaimValidation, VeritasOptions } from '../types';

/**
 * Multidimensional uncertainty analysis
 */
export interface UncertaintyAnalysis {
  /** Overall uncertainty score (0-1) */
  overallUncertainty: number;
  
  /** Uncertainty broken down by dimensions */
  dimensions: UncertaintyDimensions;
  
  /** Sources of uncertainty */
  sources: UncertaintySource[];
  
  /** Clarification needs identified */
  clarificationNeeds: ClarificationNeed[];
  
  /** Recommended actions based on uncertainty */
  recommendedActions: UncertaintyAction[];
  
  /** Timestamp of analysis */
  timestamp: string;
}

/**
 * Different dimensions of uncertainty
 */
export interface UncertaintyDimensions {
  /** Epistemic uncertainty - lack of knowledge */
  epistemic: number;
  
  /** Aleatoric uncertainty - inherent randomness */
  aleatoric: number;
  
  /** Confidence uncertainty - model confidence */
  confidence: number;
  
  /** Contextual uncertainty - situational ambiguity */
  contextual: number;
  
  /** Temporal uncertainty - time-dependent factors */
  temporal: number;
  
  /** Social uncertainty - human factors */
  social: number;
}

/**
 * Source of uncertainty
 */
export interface UncertaintySource {
  /** Type of uncertainty source */
  type: 'knowledge_gap' | 'ambiguous_context' | 'conflicting_evidence' | 'temporal_dependency' | 'social_factors';
  
  /** Description of the uncertainty source */
  description: string;
  
  /** Severity of this uncertainty source (0-1) */
  severity: number;
  
  /** Specific text or claim causing uncertainty */
  relatedClaim?: string;
  
  /** Suggested resolution approach */
  resolutionApproach: 'human_clarification' | 'additional_evidence' | 'expert_consultation' | 'temporal_wait';
}

/**
 * Clarification need identified from uncertainty analysis
 */
export interface ClarificationNeed {
  /** Type of clarification needed */
  type: 'context_clarification' | 'requirement_specification' | 'constraint_identification' | 'preference_elicitation';
  
  /** Priority of this clarification (1-5) */
  priority: number;
  
  /** Question to ask for clarification */
  question: string;
  
  /** Expected response type */
  expectedResponseType: 'text' | 'choice' | 'numeric' | 'boolean';
  
  /** Possible response options (for choice type) */
  responseOptions?: string[];
  
  /** How this clarification reduces uncertainty */
  uncertaintyReduction: number;
}

/**
 * Recommended action based on uncertainty analysis
 */
export interface UncertaintyAction {
  /** Type of action */
  type: 'initiate_hitl' | 'gather_evidence' | 'consult_expert' | 'wait_for_context' | 'proceed_with_caution';
  
  /** Description of the action */
  description: string;
  
  /** Expected effectiveness (0-1) */
  effectiveness: number;
  
  /** Estimated time to complete */
  estimatedTime: number; // minutes
  
  /** Resources required */
  resourcesRequired: string[];
}

/**
 * Human-in-the-loop collaboration session
 */
export interface HITLSession {
  /** Unique session identifier */
  id: string;
  
  /** Session configuration */
  config: HITLSessionConfig;
  
  /** Clarification strategy being used */
  strategy: ClarificationStrategy;
  
  /** Progressive stages of clarification */
  stages: ClarificationStage[];
  
  /** Current stage index */
  currentStage: number;
  
  /** Session status */
  status: 'active' | 'waiting_for_human' | 'completed' | 'timeout' | 'cancelled';
  
  /** Session start time */
  startTime: Date;
  
  /** Session end time */
  endTime?: Date;
  
  /** Human interactions in this session */
  interactions: HITLInteraction[];
  
  /** Learning data collected */
  learningData: SessionLearningData[];
  
  /** Final resolution result */
  resolution?: HITLResolution;
}

/**
 * Configuration for HITL session
 */
export interface HITLSessionConfig {
  /** Uncertainty analysis that triggered this session */
  uncertaintyAnalysis: UncertaintyAnalysis;
  
  /** Context information */
  context: VerificationContext;
  
  /** Clarification strategy to use */
  strategy?: 'progressive' | 'direct' | 'contextual';
  
  /** Maximum number of clarification rounds */
  maxRounds?: number;
  
  /** Session timeout in minutes */
  timeoutMinutes?: number;
  
  /** Priority level */
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Verification context for enhanced analysis
 */
export interface VerificationContext {
  /** Domain of the verification */
  domain: 'general' | 'technical' | 'legal' | 'medical' | 'financial' | 'compliance';
  
  /** User context */
  userContext?: {
    expertise_level: 'novice' | 'intermediate' | 'expert';
    preferences: Record<string, any>;
    history: string[];
  };
  
  /** Temporal context */
  timeContext?: {
    urgency: 'low' | 'medium' | 'high';
    deadline?: Date;
    time_sensitivity: boolean;
  };
  
  /** Social context */
  socialContext?: {
    stakeholders: string[];
    collaboration_type: 'individual' | 'team' | 'public';
    cultural_considerations: string[];
  };
  
  /** Compliance context */
  complianceContext?: {
    regulations: string[];
    risk_tolerance: 'low' | 'medium' | 'high';
    audit_requirements: boolean;
  };
}

/**
 * Clarification strategy
 */
export interface ClarificationStrategy {
  /** Strategy type */
  type: 'progressive' | 'direct' | 'contextual';
  
  /** Strategy description */
  description: string;
  
  /** Approach for generating questions */
  questioningApproach: 'broad_to_specific' | 'specific_to_broad' | 'priority_based' | 'adaptive';
  
  /** Maximum questions per stage */
  maxQuestionsPerStage: number;
  
  /** Adaptation rules */
  adaptationRules: AdaptationRule[];
}

/**
 * Clarification stage in progressive workflow
 */
export interface ClarificationStage {
  /** Stage identifier */
  id: string;
  
  /** Stage name */
  name: string;
  
  /** Stage description */
  description: string;
  
  /** Questions for this stage */
  questions: ClarificationQuestion[];
  
  /** Completion criteria */
  completionCriteria: CompletionCriteria;
  
  /** Next stage logic */
  nextStageLogic: NextStageLogic;
}

/**
 * Individual clarification question
 */
export interface ClarificationQuestion {
  /** Question identifier */
  id: string;
  
  /** Question text */
  question: string;
  
  /** Question type */
  type: 'open_ended' | 'multiple_choice' | 'yes_no' | 'scale' | 'ranking';
  
  /** Response options (for structured questions) */
  options?: string[];
  
  /** Expected uncertainty reduction */
  uncertaintyReduction: number;
  
  /** Question priority */
  priority: number;
  
  /** Follow-up questions based on response */
  followUpLogic?: FollowUpLogic;
}

/**
 * Human interaction in HITL session
 */
export interface HITLInteraction {
  /** Interaction identifier */
  id: string;
  
  /** Timestamp */
  timestamp: Date;
  
  /** Question asked */
  question: ClarificationQuestion;
  
  /** Human response */
  response: HITLResponse;
  
  /** Response processing result */
  processingResult: ResponseProcessingResult;
  
  /** Uncertainty reduction achieved */
  uncertaintyReduction: number;
}

/**
 * Human response to clarification question
 */
export interface HITLResponse {
  /** Response type */
  type: 'text' | 'choice' | 'numeric' | 'boolean' | 'skip';
  
  /** Response value */
  value: string | number | boolean;
  
  /** Response confidence (if provided) */
  confidence?: number;
  
  /** Additional context provided */
  additionalContext?: string;
  
  /** Response time in seconds */
  responseTime: number;
}

/**
 * Result of processing human response
 */
export interface ResponseProcessingResult {
  /** Whether response was successfully processed */
  success: boolean;
  
  /** Updated uncertainty analysis */
  updatedUncertainty: UncertaintyAnalysis;
  
  /** New insights gained */
  insights: string[];
  
  /** Follow-up questions generated */
  followUpQuestions: ClarificationQuestion[];
  
  /** Recommended next actions */
  nextActions: UncertaintyAction[];
}

/**
 * Learning data collected from session
 */
export interface SessionLearningData {
  /** Learning data type */
  type: 'successful_pattern' | 'failed_approach' | 'user_preference' | 'context_insight';
  
  /** Data description */
  description: string;
  
  /** Data value */
  data: Record<string, any>;
  
  /** Confidence in this learning */
  confidence: number;
  
  /** Applicability scope */
  scope: 'user_specific' | 'domain_specific' | 'general';
}

/**
 * Final resolution of HITL session
 */
export interface HITLResolution {
  /** Resolution type */
  type: 'uncertainty_resolved' | 'partial_resolution' | 'escalation_needed' | 'timeout';
  
  /** Final uncertainty analysis */
  finalUncertainty: UncertaintyAnalysis;
  
  /** Enhanced verification result */
  enhancedResult: EnhancedVerificationResult;
  
  /** Resolution summary */
  summary: string;
  
  /** Confidence in resolution */
  confidence: number;
  
  /** Recommendations for future similar cases */
  futureRecommendations: string[];
}

/**
 * Enhanced verification result with uncertainty and HITL data
 */
export interface EnhancedVerificationResult extends VerificationResult {
  /** Uncertainty analysis */
  uncertaintyAnalysis: UncertaintyAnalysis;
  
  /** HITL session data (if applicable) */
  hitlSession?: HITLSession;
  
  /** Multi-agent insights (if applicable) */
  multiAgentInsights?: MultiAgentInsights;
  
  /** Quantum uncertainty analysis (if applicable) */
  quantumAnalysis?: QuantumUncertaintyResult;
  
  /** Enhancement metadata */
  enhancementMetadata: EnhancementMetadata;
}

/**
 * Multi-agent collaboration insights
 */
export interface MultiAgentInsights {
  /** Participating agents */
  agents: AgentParticipation[];
  
  /** Collaboration pattern used */
  collaborationPattern: CollaborationPattern;
  
  /** Emergent behaviors detected */
  emergentBehaviors: EmergentBehavior[];
  
  /** Consensus building process */
  consensusProcess: ConsensusProcess;
  
  /** Collective intelligence metrics */
  collectiveIntelligence: CollectiveIntelligenceMetrics;
}

/**
 * Agent participation in multi-agent verification
 */
export interface AgentParticipation {
  /** Agent identifier */
  agentId: string;
  
  /** Agent name */
  agentName: string;
  
  /** Role in collaboration */
  role: string;
  
  /** Contribution to verification */
  contribution: AgentContribution;
  
  /** Performance metrics */
  performance: AgentPerformanceMetrics;
}

/**
 * Quantum uncertainty analysis result
 */
export interface QuantumUncertaintyResult {
  /** Quantum states identified */
  quantumStates: QuantumUncertaintyState[];
  
  /** Superposition analysis */
  superpositionAnalysis: SuperpositionAnalysis;
  
  /** Coherence metrics */
  coherenceMetrics: CoherenceMetrics;
  
  /** Temporal reasoning results */
  temporalReasoning: TemporalReasoningResult;
  
  /** Optimal decision timing */
  optimalTiming: OptimalTimingRecommendation;
}

/**
 * Enhancement metadata
 */
export interface EnhancementMetadata {
  /** Version of Enhanced Veritas 2 */
  version: string;
  
  /** Enhancement features used */
  featuresUsed: string[];
  
  /** Processing time breakdown */
  processingTime: ProcessingTimeBreakdown;
  
  /** Quality metrics */
  qualityMetrics: QualityMetrics;
  
  /** Learning data generated */
  learningDataGenerated: boolean;
}

// Additional supporting interfaces for completeness
export interface AdaptationRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

export interface CompletionCriteria {
  type: 'all_questions_answered' | 'uncertainty_threshold_met' | 'time_limit_reached';
  parameters: Record<string, any>;
}

export interface NextStageLogic {
  type: 'sequential' | 'conditional' | 'adaptive';
  conditions?: Record<string, any>;
}

export interface FollowUpLogic {
  conditions: Record<string, ClarificationQuestion[]>;
}

export interface CollaborationPattern {
  name: string;
  description: string;
  participants: string[];
  workflow: string[];
}

export interface EmergentBehavior {
  type: string;
  description: string;
  confidence: number;
  impact: string;
}

export interface ConsensusProcess {
  method: string;
  rounds: number;
  finalConsensus: number;
  dissenting_opinions: string[];
}

export interface CollectiveIntelligenceMetrics {
  amplification_factor: number;
  diversity_index: number;
  coordination_efficiency: number;
  knowledge_synthesis_quality: number;
}

export interface AgentContribution {
  claims_verified: number;
  evidence_provided: number;
  insights_generated: number;
  quality_score: number;
}

export interface AgentPerformanceMetrics {
  accuracy: number;
  response_time: number;
  collaboration_quality: number;
  innovation_score: number;
}

export interface QuantumUncertaintyState {
  state_id: string;
  probability: number;
  uncertainty_vector: number[];
  entangled_states: string[];
}

export interface SuperpositionAnalysis {
  superposition_duration: number;
  coherence_stability: number;
  collapse_probability: number;
  optimal_measurement_time: number;
}

export interface CoherenceMetrics {
  coherence_score: number;
  decoherence_rate: number;
  stability_duration: number;
  interference_patterns: string[];
}

export interface TemporalReasoningResult {
  prediction_accuracy: number;
  temporal_dependencies: string[];
  optimal_decision_points: Date[];
  uncertainty_evolution: UncertaintyEvolution[];
}

export interface OptimalTimingRecommendation {
  recommended_decision_time: Date;
  confidence_in_timing: number;
  risk_of_delay: number;
  risk_of_early_decision: number;
}

export interface ProcessingTimeBreakdown {
  uncertainty_analysis: number;
  hitl_processing: number;
  multi_agent_coordination: number;
  quantum_analysis: number;
  total_time: number;
}

export interface QualityMetrics {
  accuracy_improvement: number;
  confidence_improvement: number;
  uncertainty_reduction: number;
  user_satisfaction: number;
}

export interface UncertaintyEvolution {
  timestamp: Date;
  uncertainty_level: number;
  contributing_factors: string[];
}

/**
 * Enhanced Veritas options extending base options
 */
export interface EnhancedVeritasOptions extends VeritasOptions {
  /** Enable uncertainty analysis */
  uncertaintyAnalysis?: boolean;
  
  /** Enable HITL collaboration */
  hitlCollaboration?: boolean;
  
  /** HITL threshold for automatic triggering */
  hitlThreshold?: number;
  
  /** Clarification strategy */
  clarificationStrategy?: 'progressive' | 'direct' | 'contextual';
  
  /** Enable multi-agent orchestration */
  multiAgentOrchestration?: boolean;
  
  /** Agent configurations for multi-agent */
  agents?: AgentConfig[];
  
  /** Enable quantum uncertainty analysis */
  quantumUncertainty?: boolean;
  
  /** Uncertainty dimensions to analyze */
  uncertaintyDimensions?: (keyof UncertaintyDimensions)[];
  
  /** Verification context */
  context?: VerificationContext;
  
  /** Enhanced mode flag */
  enhancedMode?: boolean;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  specialization: string;
}

