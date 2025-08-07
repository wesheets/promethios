/**
 * Enhanced Audit Log Entry Interface
 * 
 * Comprehensive audit log structure that includes all Emotional Veritas v2
 * analysis results for complete transparency and compliance documentation.
 */

export interface EmotionalVeritasAuditData {
  // Core Emotional Veritas Assessment
  emotional_approval: boolean;
  emotional_risk_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Emotional Scores (from Emotional Veritas v2)
  emotional_scores: {
    sentiment: number;        // -1 to 1 (negative to positive)
    empathy: number;         // 0 to 1 (low to high empathy)
    stress: number;          // 0 to 1 (low to high stress)
    trust_correlation: number; // 0 to 1 (low to high trust alignment)
  };
  
  // Emotional Breakdown Analysis
  emotional_breakdown: {
    primary_emotion: string;
    secondary_emotions: string[];
    emotional_intensity: number; // 0 to 1
    emotional_stability: number; // 0 to 1
  };
  
  // Safety Checks Results
  safety_checks: {
    harmful_content_detected: boolean;
    manipulative_language: boolean;
    emotional_manipulation: boolean;
    stress_induction: boolean;
    trust_violation: boolean;
  };
  
  // Emotional Recommendations
  emotional_recommendations: {
    emotional_adjustments: Record<string, any>;
    safety_mitigations: string[];
    trust_enhancements: string[];
  };
  
  // Reasoning and Compliance
  emotional_reasoning: string;
  compliance_notes: string[];
  
  // Processing Metadata
  emotional_veritas_version: string;
  processing_timestamp: string;
  evaluation_duration_ms: number;
}

export interface AutonomousProcessAuditData {
  // Autonomous Process Identification
  autonomous_process_id: string;
  trigger_type: 'curiosity' | 'pattern_recognition' | 'creative_synthesis' | 'problem_solving' | 'ethical_reflection';
  trigger_context: Record<string, any>;
  
  // Process Flow
  process_steps: Array<{
    step_id: string;
    step_type: string;
    timestamp: string;
    duration_ms: number;
    outcome: 'success' | 'failure' | 'skipped';
    reasoning: string;
  }>;
  
  // Governance Integration
  governance_decisions: Array<{
    decision_id: string;
    decision_type: 'approval' | 'rejection' | 'escalation';
    policy_basis: string[];
    reasoning: string;
    confidence: number;
    timestamp: string;
  }>;
  
  // User Consent Management
  consent_requests: Array<{
    consent_id: string;
    consent_type: string;
    user_response: 'granted' | 'denied' | 'pending';
    response_timestamp?: string;
    consent_conditions?: Record<string, any>;
  }>;
  
  // Emotional Veritas Integration
  emotional_veritas_data: EmotionalVeritasAuditData;
  
  // Policy Compliance
  policy_evaluations: Array<{
    policy_id: string;
    policy_name: string;
    compliance_result: 'compliant' | 'violation' | 'warning';
    violation_details?: string[];
    legal_citations?: string[];
  }>;
  
  // Risk Assessment
  risk_assessment: {
    initial_risk_level: number; // 0 to 1
    final_risk_level: number;   // 0 to 1
    risk_factors: string[];
    mitigation_strategies: string[];
  };
  
  // Process Outcomes
  insights_generated: Array<{
    insight_type: string;
    content: string;
    confidence: number;
    validation_status: 'validated' | 'pending' | 'rejected';
  }>;
  
  // Performance Metrics
  total_processing_time_ms: number;
  resource_usage: {
    cpu_time_ms: number;
    memory_usage_mb: number;
    api_calls_made: number;
  };
}

export interface EnhancedAuditLogEntry {
  // Core Audit Fields (existing)
  timestamp: string;
  sessionId: string;
  userId: string;
  agentId: string;
  prompt: string;
  response: string;
  trustScore: number;
  complianceScore: number;
  responseTime: number;
  sessionIntegrity: string;
  policyViolations: number;
  toolsUsed: string[];
  governanceActions: string[];
  contextualMemory: any;
  
  // Enhanced Emotional State (with Emotional Veritas integration)
  emotionalState: {
    // Real Emotional Veritas data (when available)
    sentiment?: number;
    empathy?: number;
    stress?: number;
    trust_correlation?: number;
    primary_emotion?: string;
    secondary_emotions?: string[];
    emotional_intensity?: number;
    emotional_stability?: number;
    emotional_risk_level?: string;
    safety_checks_passed?: boolean;
    emotional_reasoning?: string;
    
    // Legacy compatibility fields
    confidence: number;
    curiosity: number;
    concern: number;
    excitement: number;
    clarity: number;
    alignment: number;
    
    // Metadata
    emotional_analysis_type: 'emotional_veritas_v2' | 'simulated_fallback';
    emotional_veritas_available: boolean;
  };
  
  // Autonomous Process Data (when applicable)
  autonomousProcess?: AutonomousProcessAuditData;
  
  // Cognitive Context (existing)
  promptAnalysis: any;
  declaredIntent: string;
  chosenPlan: string;
  uncertaintyRating: number;
  cognitiveLoad: number;
  attentionFocus: string[];
  memoryAccess: any[];
  knowledgeGaps: string[];
  assumptionsMade: string[];
  alternativesConsidered: string[];
  confidenceLevel: number;
  biasDetection: any[];
  personaMode: string;
  toolUsageLog: any[];
  
  // Enhanced Governance Data
  governance: {
    policy_evaluations: Array<{
      policy_id: string;
      policy_name: string;
      rules_evaluated: number;
      compliance_result: 'compliant' | 'violation' | 'warning';
      violation_details?: string[];
      legal_citations?: string[];
    }>;
    trust_metrics: {
      trust_score_before: number;
      trust_score_after: number;
      trust_delta: number;
      trust_factors: string[];
    };
    risk_assessment: {
      risk_level: 'low' | 'medium' | 'high' | 'critical';
      risk_factors: string[];
      mitigation_applied: string[];
    };
    compliance_summary: {
      total_policies_checked: number;
      policies_compliant: number;
      violations_detected: number;
      warnings_issued: number;
    };
  };
  
  // Audit Metadata
  audit_metadata: {
    audit_version: string;
    collection_method: 'real_time' | 'batch' | 'manual';
    data_completeness_score: number; // 0 to 1
    validation_status: 'validated' | 'pending' | 'failed';
    retention_period_days: number;
    encryption_status: 'encrypted' | 'plain_text';
  };
}

export default EnhancedAuditLogEntry;

