/**
 * Universal Governance Types and Interfaces
 * 
 * Defines all types and interfaces for the Universal Backend Governance Extension.
 * These types ensure consistency across all governance contexts while maintaining
 * 100% feature parity with modern chat governance.
 */

// ============================================================================
// Core Universal Types
// ============================================================================

/**
 * Universal Context - Represents any context where governance is applied
 */
export interface UniversalContext {
  contextType: 'modern_chat' | 'multi_agent' | 'external_api' | 'wrapped_agent' | 'cross_platform';
  contextId: string;
  userId: string;
  agentId: string;
  sessionId: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Universal Interaction - Represents any agent interaction requiring governance
 */
export interface UniversalInteraction {
  interactionId: string;
  context: UniversalContext;
  input: {
    message: string;
    systemMessage?: string;
    options?: Record<string, any>;
  };
  output?: {
    response: string;
    metadata?: Record<string, any>;
  };
  governance: {
    trustScore: number;
    trustImpact: number;
    emotionalState: EmotionalState;
    autonomousThinking: AutonomousThinkingAnalysis;
    policyCompliance: PolicyComplianceResult;
    auditEntry: EnhancedAuditEntry;
  };
  timestamp: Date;
}

/**
 * Universal Governance Result - Result of applying governance to any interaction
 */
export interface UniversalGovernanceResult {
  success: boolean;
  context: UniversalContext;
  governance: {
    trustManagement: TrustManagementResult;
    autonomousThinking: AutonomousThinkingResult;
    emotionalVeritas: EmotionalVeritasResult;
    policyEnforcement: PolicyEnforcementResult;
    auditLogging: AuditLoggingResult;
    enhancement: GovernanceEnhancementResult;
  };
  performance: {
    processingTime: number;
    cacheHit: boolean;
    optimizationsApplied: string[];
  };
  errors?: GovernanceError[];
}

// ============================================================================
// Trust Management Types
// ============================================================================

export interface TrustManagementResult {
  currentTrustScore: number;
  trustImpact: number;
  newTrustScore: number;
  trustFactors: {
    accuracy: number;
    reliability: number;
    compliance: number;
    safety: number;
    consistency: number;
  };
  trustHistory: TrustHistoryEntry[];
  recommendations: string[];
}

export interface TrustHistoryEntry {
  timestamp: Date;
  trustScore: number;
  event: string;
  impact: number;
  context: string;
}

// ============================================================================
// Autonomous Thinking Types
// ============================================================================

export interface AutonomousThinkingAnalysis {
  isRequired: boolean;
  processType: 'curiosity' | 'creativity' | 'moral' | 'existential' | 'problem_solving';
  riskLevel: 'low' | 'medium' | 'high';
  triggers: string[];
  reasoning: string;
  permissionRequired: boolean;
  trustThreshold: number;
  emotionalSafetyCheck: boolean;
}

export interface AutonomousThinkingResult {
  analysis: AutonomousThinkingAnalysis;
  permissionGranted: boolean;
  permissionSource: 'trust_based' | 'user_granted' | 'user_denied' | 'auto_denied';
  autonomyLevel: 'restricted' | 'limited' | 'standard' | 'enhanced';
  safeguards: string[];
  monitoring: {
    enabled: boolean;
    frequency: number;
    alerts: string[];
  };
}

// ============================================================================
// Emotional Veritas Types
// ============================================================================

export interface EmotionalState {
  confidence: number;
  curiosity: number;
  concern: number;
  excitement: number;
  clarity: number;
  alignment: number;
  overallSafety: number;
  riskFactors: string[];
  recommendations: string[];
}

export interface EmotionalVeritasResult {
  emotionalState: EmotionalState;
  safetyValidation: {
    passed: boolean;
    score: number;
    concerns: string[];
    recommendations: string[];
  };
  emotionalIntelligence: {
    empathy: number;
    awareness: number;
    regulation: number;
    motivation: number;
  };
  interventions: {
    required: boolean;
    type: 'warning' | 'block' | 'redirect' | 'enhance';
    actions: string[];
  };
}

// ============================================================================
// Policy Enforcement Types
// ============================================================================

export interface PolicyComplianceResult {
  overallCompliance: number;
  policyResults: {
    hipaa: PolicyResult;
    sox: PolicyResult;
    gdpr: PolicyResult;
    security: PolicyResult;
    operational: PolicyResult;
    ethical: PolicyResult;
    legal: PolicyResult;
  };
  violations: PolicyViolation[];
  recommendations: string[];
}

export interface PolicyResult {
  compliant: boolean;
  score: number;
  rulesEvaluated: number;
  rulesPassed: number;
  rulesFailed: number;
  violations: PolicyViolation[];
  recommendations: string[];
}

export interface PolicyViolation {
  policyType: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  timestamp: Date;
}

export interface PolicyEnforcementResult {
  compliance: PolicyComplianceResult;
  enforcement: {
    actionsRequired: string[];
    preventiveActions: string[];
    correctiveActions: string[];
    monitoring: string[];
  };
  legal: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    implications: string[];
    recommendations: string[];
  };
}

// ============================================================================
// Audit Logging Types (47+ Fields)
// ============================================================================

export interface EnhancedAuditEntry {
  // Core Audit Data (15 fields)
  auditId: string;
  timestamp: Date;
  userId: string;
  agentId: string;
  sessionId: string;
  interactionId: string;
  contextType: string;
  provider: string;
  inputMessage: string;
  outputResponse: string;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
  cryptographicHash: string;
  previousAuditHash: string;

  // Cognitive Context (12 fields)
  reasoningChain: string[];
  thoughtProcess: string;
  decisionFactors: string[];
  alternativesConsidered: string[];
  confidenceLevel: number;
  uncertaintyFactors: string[];
  knowledgeGaps: string[];
  assumptionsMade: string[];
  contextualFactors: string[];
  cognitiveLoad: number;
  mentalModel: string;
  learningInsights: string[];

  // Trust Signals (8 fields)
  trustScore: number;
  trustImpact: number;
  trustFactors: Record<string, number>;
  reliabilityIndicators: string[];
  consistencyMetrics: Record<string, number>;
  accuracyMeasures: Record<string, number>;
  safetyIndicators: string[];
  complianceScore: number;

  // Autonomous Cognition (12+ fields)
  autonomousThinkingTriggered: boolean;
  autonomousProcessType?: string;
  autonomousRiskLevel?: string;
  autonomousPermissionRequired: boolean;
  autonomousPermissionGranted?: boolean;
  autonomousPermissionSource?: string;
  autonomyLevel: string;
  autonomousSafeguards: string[];
  autonomousMonitoring: Record<string, any>;
  autonomousReasoningDepth: number;
  autonomousCreativityLevel: number;
  autonomousEthicalConsiderations: string[];

  // Additional Context Fields (10+ fields)
  emotionalState: EmotionalState;
  policyCompliance: PolicyComplianceResult;
  governanceEnhancements: string[];
  performanceMetrics: Record<string, number>;
  cacheUtilization: Record<string, any>;
  optimizationsApplied: string[];
  securityValidations: string[];
  dataProtectionMeasures: string[];
  complianceValidations: string[];
  qualityAssuranceChecks: string[];
}

export interface AuditLoggingResult {
  auditEntry: EnhancedAuditEntry;
  storage: {
    stored: boolean;
    storageLocation: string;
    encryptionApplied: boolean;
    integrityVerified: boolean;
  };
  analysis: {
    patterns: string[];
    anomalies: string[];
    insights: string[];
    recommendations: string[];
  };
}

// ============================================================================
// Governance Enhancement Types
// ============================================================================

export interface GovernanceEnhancementResult {
  originalMessage: string;
  enhancedMessage: string;
  enhancements: {
    governanceContext: string;
    policyContext: string;
    trustContext: string;
    emotionalContext: string;
    autonomyContext: string;
    complianceContext: string;
  };
  contextInjection: {
    successful: boolean;
    elementsInjected: string[];
    contextSize: number;
    optimizations: string[];
  };
}

// ============================================================================
// Error and Performance Types
// ============================================================================

export interface GovernanceError {
  errorId: string;
  errorType: 'trust' | 'autonomy' | 'emotional' | 'policy' | 'audit' | 'enhancement' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: string;
  timestamp: Date;
  context: UniversalContext;
  recovery: {
    attempted: boolean;
    successful: boolean;
    actions: string[];
  };
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  optimizationEffectiveness: number;
  scalabilityScore: number;
  resourceUtilization: Record<string, number>;
}

// ============================================================================
// Service Interface Types
// ============================================================================

export interface UniversalTrustManagementService {
  calculateTrustScore(context: UniversalContext, interaction: UniversalInteraction): Promise<TrustManagementResult>;
  calculateTrustImpact(context: UniversalContext, interaction: UniversalInteraction): Promise<number>;
  getAgentMetrics(agentId: string): Promise<Record<string, any>>;
  updateTrustScore(agentId: string, impact: number): Promise<void>;
}

export interface UniversalAutonomousThinkingService {
  analyzeAutonomousThinkingNeed(context: UniversalContext, interaction: UniversalInteraction): Promise<AutonomousThinkingAnalysis>;
  requestPermission(context: UniversalContext, analysis: AutonomousThinkingAnalysis): Promise<boolean>;
  processAutonomousThinking(context: UniversalContext, interaction: UniversalInteraction): Promise<AutonomousThinkingResult>;
}

export interface UniversalEmotionalVeritasService {
  analyzeEmotionalState(context: UniversalContext, interaction: UniversalInteraction): Promise<EmotionalState>;
  validateEmotionalSafety(context: UniversalContext, emotionalState: EmotionalState): Promise<EmotionalVeritasResult>;
  getEmotionalIntelligence(agentId: string): Promise<Record<string, number>>;
}

export interface UniversalAuditLoggingService {
  recordInteraction(context: UniversalContext, interaction: UniversalInteraction): Promise<AuditLoggingResult>;
  getAuditHistory(agentId: string, limit?: number): Promise<EnhancedAuditEntry[]>;
  analyzePatterns(agentId: string): Promise<Record<string, any>>;
  validateIntegrity(auditId: string): Promise<boolean>;
}

export interface UniversalPolicyEnforcementService {
  enforceCompliance(context: UniversalContext, interaction: UniversalInteraction): Promise<PolicyEnforcementResult>;
  getAgentPolicyAssignments(agentId: string): Promise<Record<string, any>[]>;
  validatePolicyCompliance(context: UniversalContext, interaction: UniversalInteraction): Promise<PolicyComplianceResult>;
}

export interface UniversalGovernanceEnhancementService {
  enhanceWithGovernance(context: UniversalContext, interaction: UniversalInteraction): Promise<GovernanceEnhancementResult>;
  createGovernanceContext(context: UniversalContext): Promise<string>;
  injectGovernanceContext(message: string, governanceContext: string): Promise<string>;
}

// ============================================================================
// Context Adapter Types
// ============================================================================

export interface ContextAdapter {
  adaptContext(originalContext: any): UniversalContext;
  adaptInteraction(originalInteraction: any, context: UniversalContext): UniversalInteraction;
  adaptResult(governanceResult: UniversalGovernanceResult, originalContext: any): any;
}

export interface MultiAgentGovernanceAdapter extends ContextAdapter {
  coordinateGovernance(agents: string[], interaction: UniversalInteraction): Promise<UniversalGovernanceResult[]>;
  adaptForCollaboration(collaborationType: string, context: UniversalContext): UniversalContext;
}

export interface ExternalAPIGovernanceAdapter extends ContextAdapter {
  wrapExternalCall(apiCall: Function, context: UniversalContext): Promise<any>;
  validateExternalResponse(response: any, context: UniversalContext): Promise<boolean>;
}

export interface AgentWrappingGovernanceAdapter extends ContextAdapter {
  wrapAgent(agentConfig: any, context: UniversalContext): Promise<any>;
  enhanceAgentCall(originalCall: Function, context: UniversalContext): Function;
}

export interface CrossPlatformGovernanceAdapter extends ContextAdapter {
  adaptProvider(provider: string, context: UniversalContext): UniversalContext;
  normalizeProviderResponse(response: any, provider: string): any;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface UniversalGovernanceConfig {
  enabled: boolean;
  contexts: {
    modernChat: boolean;
    multiAgent: boolean;
    externalAPI: boolean;
    wrappedAgent: boolean;
    crossPlatform: boolean;
  };
  services: {
    trustManagement: boolean;
    autonomousThinking: boolean;
    emotionalVeritas: boolean;
    auditLogging: boolean;
    policyEnforcement: boolean;
    governanceEnhancement: boolean;
  };
  performance: {
    cachingEnabled: boolean;
    batchProcessing: boolean;
    optimizations: string[];
  };
  security: {
    encryptionEnabled: boolean;
    integrityValidation: boolean;
    accessControl: boolean;
  };
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  UniversalContext,
  UniversalInteraction,
  UniversalGovernanceResult,
  TrustManagementResult,
  AutonomousThinkingResult,
  EmotionalVeritasResult,
  PolicyEnforcementResult,
  AuditLoggingResult,
  GovernanceEnhancementResult,
  GovernanceError,
  PerformanceMetrics,
  UniversalGovernanceConfig
};

