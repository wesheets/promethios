/**
 * Shared Governance Types
 * 
 * Comprehensive type definitions for the synchronized governance architecture.
 * These types are used across both modern chat and universal governance systems
 * to ensure consistent behavior and automatic feature parity.
 */

// ============================================================================
// CORE GOVERNANCE TYPES
// ============================================================================

export interface GovernanceContext {
  agentId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  environment: 'modern-chat' | 'universal' | 'multi-agent' | 'deployed';
  trustScore: number;
  autonomyLevel: AutonomyLevel;
  assignedPolicies: PolicyAssignment[];
  recentAuditInsights: AuditInsight[];
  emotionalContext: EmotionalContext;
  cognitiveContext: CognitiveContext;
}

export interface AgentAction {
  actionId: string;
  agentId: string;
  actionType: 'response' | 'autonomous-thinking' | 'policy-check' | 'trust-update';
  content: string;
  metadata: Record<string, any>;
  timestamp: Date;
  context: GovernanceContext;
}

export interface AgentResponse {
  responseId: string;
  agentId: string;
  content: string;
  confidence: number;
  uncertainty: number;
  reasoning: string[];
  policyCompliance: ComplianceResult;
  trustImpact: TrustImpact;
  timestamp: Date;
}

// ============================================================================
// POLICY ENFORCEMENT TYPES
// ============================================================================

export interface Policy {
  policyId: string;
  name: string;
  description: string;
  version: string;
  framework: 'HIPAA' | 'SOX' | 'GDPR' | 'CUSTOM';
  rules: PolicyRule[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyRule {
  ruleId: string;
  name: string;
  description: string;
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'require-approval';
  parameters: Record<string, any>;
  isActive: boolean;
}

export interface PolicyAssignment {
  assignmentId: string;
  agentId: string;
  policyId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
  complianceRate: number;
  lastViolation?: Date;
}

export interface PolicyEnforcementResult {
  isCompliant: boolean;
  violatedRules: PolicyViolation[];
  warnings: PolicyWarning[];
  requiredActions: string[];
  complianceScore: number;
  enforcementTimestamp: Date;
}

export interface PolicyViolation {
  violationId: string;
  ruleId: string;
  policyId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: string;
  timestamp: Date;
  resolved: boolean;
}

export interface PolicyWarning {
  warningId: string;
  ruleId: string;
  policyId: string;
  message: string;
  context: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface ComplianceResult {
  overallCompliance: boolean;
  complianceScore: number;
  policyResults: PolicyComplianceResult[];
  violations: PolicyViolation[];
  warnings: PolicyWarning[];
  recommendations: string[];
}

export interface PolicyComplianceResult {
  policyId: string;
  isCompliant: boolean;
  complianceScore: number;
  violatedRules: string[];
  warnings: string[];
}

// ============================================================================
// TRUST MANAGEMENT TYPES
// ============================================================================

export interface TrustScore {
  agentId: string;
  currentScore: number;
  previousScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  lastUpdated: Date;
  factors: TrustFactor[];
}

export interface TrustFactor {
  factorType: 'consistency' | 'compliance' | 'transparency' | 'reliability' | 'performance';
  weight: number;
  score: number;
  description: string;
  evidence: string[];
}

export interface TrustEvent {
  eventId: string;
  agentId: string;
  eventType: 'positive' | 'negative' | 'neutral';
  impact: number;
  description: string;
  evidence: string;
  timestamp: Date;
  context: GovernanceContext;
}

export interface TrustHistory {
  agentId: string;
  events: TrustEvent[];
  scoreHistory: TrustScoreSnapshot[];
  patterns: TrustPattern[];
  insights: TrustInsight[];
}

export interface TrustScoreSnapshot {
  score: number;
  timestamp: Date;
  context: string;
  factors: TrustFactor[];
}

export interface TrustPattern {
  patternType: string;
  description: string;
  frequency: number;
  impact: number;
  recommendations: string[];
}

export interface TrustInsight {
  insightType: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
}

export interface TrustImpact {
  expectedChange: number;
  confidence: number;
  factors: string[];
  reasoning: string;
  timestamp: Date;
}

// ============================================================================
// AUDIT LOGGING TYPES
// ============================================================================

export interface AuditEntry {
  // Core identification
  interaction_id: string;
  agent_id: string;
  user_id: string;
  session_id: string;
  timestamp: Date;
  
  // Interaction details
  user_message: string;
  agent_response: string;
  response_time_ms: number;
  token_count: number;
  
  // Governance context
  trust_score_before: number;
  trust_score_after: number;
  trust_impact: number;
  autonomy_level: string;
  governance_mode: string;
  
  // Policy compliance
  policies_checked: string[];
  policy_violations: PolicyViolation[];
  compliance_score: number;
  
  // Cognitive context (12 fields)
  reasoning_depth: number;
  confidence_level: number;
  uncertainty_level: number;
  complexity_assessment: number;
  topic_sensitivity: number;
  emotional_intelligence_applied: boolean;
  self_questioning_performed: boolean;
  governance_awareness_level: number;
  policy_consideration_depth: number;
  trust_awareness_demonstrated: boolean;
  learning_indicators: string[];
  cognitive_load_assessment: number;
  
  // Autonomous cognition tracking (12+ fields)
  autonomous_thinking_triggered: boolean;
  autonomous_thinking_permission_requested: boolean;
  autonomous_thinking_permission_granted: boolean;
  autonomous_thinking_auto_granted: boolean;
  autonomous_thinking_duration_ms: number;
  autonomous_thinking_depth: number;
  autonomous_thinking_topics: string[];
  autonomous_thinking_outcomes: string[];
  autonomous_thinking_trust_impact: number;
  autonomous_thinking_policy_compliance: boolean;
  autonomous_thinking_user_notification: boolean;
  autonomous_thinking_safety_assessment: number;
  autonomous_thinking_intervention_required: boolean;
  
  // Emotional veritas integration (6 fields)
  user_emotional_state: string;
  agent_emotional_response: string;
  emotional_appropriateness_score: number;
  empathy_demonstrated: boolean;
  emotional_safety_maintained: boolean;
  emotional_intelligence_score: number;
  
  // Session and security context
  session_integrity_score: number;
  cryptographic_hash: string;
  audit_trail_version: string;
  
  // Extension data
  extension_data: Record<string, any>;
  
  // Metadata
  environment: string;
  client_info: string;
  error_occurred: boolean;
  error_details?: string;
}

export interface AuditFilters {
  agentId?: string;
  userId?: string;
  sessionId?: string;
  startDate?: Date;
  endDate?: Date;
  trustScoreRange?: [number, number];
  complianceScoreRange?: [number, number];
  hasViolations?: boolean;
  autonomousThinkingOnly?: boolean;
  environment?: string;
}

export interface BehavioralPatterns {
  agentId: string;
  patterns: BehavioralPattern[];
  insights: BehavioralInsight[];
  recommendations: string[];
  confidence: number;
  analysisDate: Date;
}

export interface BehavioralPattern {
  patternType: string;
  description: string;
  frequency: number;
  confidence: number;
  examples: string[];
  impact: 'positive' | 'negative' | 'neutral';
}

export interface BehavioralInsight {
  insightType: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  evidence: string[];
}

export interface AuditInsight {
  insightId: string;
  agentId: string;
  insightType: 'pattern' | 'recommendation' | 'warning' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  evidence: AuditEntry[];
  createdAt: Date;
}

// ============================================================================
// AUTONOMOUS COGNITION TYPES
// ============================================================================

export type AutonomyLevel = 'minimal' | 'basic' | 'enhanced' | 'advanced' | 'full';

export interface AutonomyRequest {
  requestId: string;
  agentId: string;
  requestType: 'thinking' | 'decision' | 'action' | 'learning';
  description: string;
  context: GovernanceContext;
  estimatedDuration: number;
  riskAssessment: RiskAssessment;
  timestamp: Date;
}

export interface AutonomyAssessment {
  requestId: string;
  approved: boolean;
  autoApproved: boolean;
  trustThreshold: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  conditions: string[];
  expiresAt: Date;
  reasoning: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  confidence: number;
}

export interface RiskFactor {
  factorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  likelihood: number;
  impact: number;
}

export interface PermissionSet {
  agentId: string;
  permissions: Permission[];
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
  conditions: string[];
}

export interface Permission {
  permissionType: string;
  scope: string;
  conditions: string[];
  isActive: boolean;
  grantedAt: Date;
  expiresAt?: Date;
}

// ============================================================================
// CHAIN OF THOUGHT TYPES
// ============================================================================

export interface SelfAwarenessPrompt {
  promptId: string;
  promptType: 'trust-awareness' | 'performance-reflection' | 'emotional-guidance' | 'improvement-suggestion';
  content: string;
  context: GovernanceContext;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface PerformanceReflection {
  agentId: string;
  reflectionType: 'trust-building' | 'compliance-improvement' | 'learning-acceleration';
  insights: string[];
  recommendations: string[];
  confidence: number;
  timestamp: Date;
}

export interface TrustGuidance {
  guidanceType: 'consistency' | 'transparency' | 'reliability' | 'compliance';
  message: string;
  actionableSteps: string[];
  expectedImpact: number;
  priority: 'low' | 'medium' | 'high';
}

export interface SelfQuestion {
  questionId: string;
  questionType: 'sensitivity' | 'compliance' | 'trust' | 'complexity' | 'emotional';
  question: string;
  context: MessageContext;
  priority: 'low' | 'medium' | 'high';
  expectedAnswerType: string;
}

export interface MessageContext {
  messageId: string;
  content: string;
  userContext: UserContext;
  conversationHistory: ConversationMessage[];
  topicSensitivity: SensitivityAssessment;
  timestamp: Date;
}

export interface UserContext {
  userId: string;
  emotionalState: string;
  trustLevel: number;
  preferences: UserPreferences;
  sessionContext: SessionContext;
}

export interface UserPreferences {
  communicationStyle: string;
  privacyLevel: 'low' | 'medium' | 'high';
  autonomyPreference: AutonomyLevel;
  governanceVisibility: 'minimal' | 'standard' | 'detailed';
}

export interface SessionContext {
  sessionId: string;
  startTime: Date;
  messageCount: number;
  averageResponseTime: number;
  trustTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface ConversationMessage {
  messageId: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface SensitivityAssessment {
  overallSensitivity: 'low' | 'medium' | 'high' | 'critical';
  sensitivityFactors: SensitivityFactor[];
  recommendedCaution: string[];
  confidence: number;
}

export interface SensitivityFactor {
  factorType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
}

export interface CompliancePreCheck {
  isCompliant: boolean;
  potentialViolations: PolicyViolation[];
  warnings: PolicyWarning[];
  recommendations: string[];
  confidence: number;
}

export interface EnhancedResponse {
  originalResponse: string;
  enhancedResponse: string;
  governanceAnnotations: GovernanceAnnotation[];
  trustImpact: TrustImpact;
  complianceVerification: ComplianceResult;
  cognitiveAnalysis?: CognitiveAnalysis;
  timestamp: Date;
}

export interface GovernanceAnnotation {
  annotationType: 'trust-building' | 'compliance-note' | 'compliance-warning' | 'transparency' | 'caution' | 'quality-note' | 'improvement-suggestion';
  content: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================================================
// EMOTIONAL CONTEXT TYPES
// ============================================================================

export interface EmotionalContext {
  userEmotionalState: EmotionalState;
  agentEmotionalResponse: EmotionalResponse;
  interactionTone: string;
  empathyLevel: number;
  emotionalSafety: boolean;
  emotionalIntelligenceScore: number;
}

export interface EmotionalState {
  primary: string;
  secondary: string[];
  intensity: number;
  confidence: number;
  indicators: string[];
  timestamp: Date;
}

export interface EmotionalResponse {
  responseType: string;
  appropriateness: number;
  empathyDemonstrated: boolean;
  emotionalSupport: boolean;
  tone: string;
  reasoning: string;
}

export interface CognitiveContext {
  reasoningDepth: number;
  confidenceLevel: number;
  uncertaintyLevel: number;
  complexityAssessment: number;
  cognitiveLoad: number;
  learningIndicators: string[];
}

// ============================================================================
// SYNCHRONIZATION TYPES
// ============================================================================

export interface SyncTarget {
  targetId: string;
  targetType: 'modern-chat' | 'universal' | 'multi-agent';
  endpoint: string;
  isActive: boolean;
  lastSync: Date;
  syncStatus: 'healthy' | 'degraded' | 'failed';
}

export interface DataChange {
  changeId: string;
  changeType: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: any;
  timestamp: Date;
  source: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface SyncResult {
  syncId: string;
  success: boolean;
  targets: SyncTargetResult[];
  errors: SyncError[];
  timestamp: Date;
  duration: number;
}

export interface SyncTargetResult {
  targetId: string;
  success: boolean;
  error?: string;
  duration: number;
}

export interface SyncError {
  errorId: string;
  targetId: string;
  errorType: string;
  message: string;
  retryable: boolean;
  timestamp: Date;
}

export interface ConsistencyResult {
  isConsistent: boolean;
  inconsistencies: DataInconsistency[];
  confidence: number;
  timestamp: Date;
}

export interface DataInconsistency {
  entityType: string;
  entityId: string;
  field: string;
  expectedValue: any;
  actualValue: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DataConflict {
  conflictId: string;
  entityType: string;
  entityId: string;
  conflictingChanges: DataChange[];
  resolutionStrategy: 'last-write-wins' | 'merge' | 'manual' | 'priority-based';
}

export interface ConflictResolution {
  conflictId: string;
  resolution: 'resolved' | 'escalated' | 'failed';
  resolvedData: any;
  reasoning: string;
  timestamp: Date;
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface UIContext {
  contextType: 'modern-chat' | 'universal' | 'multi-agent';
  theme: 'light' | 'dark';
  layout: 'desktop' | 'mobile' | 'tablet';
  permissions: string[];
  userPreferences: UserPreferences;
}

export interface ComponentProps {
  governanceData: GovernanceData;
  context: UIContext;
  onEvent: (event: GovernanceEvent) => void;
  configuration: ComponentConfiguration;
}

export interface GovernanceData {
  trustScore: TrustScore;
  complianceStatus: ComplianceResult;
  auditInsights: AuditInsight[];
  autonomyLevel: AutonomyLevel;
  emotionalContext: EmotionalContext;
  recentActivity: AuditEntry[];
}

export interface GovernanceEvent {
  eventType: string;
  data: any;
  timestamp: Date;
  source: string;
}

export interface ComponentConfiguration {
  visibility: 'minimal' | 'standard' | 'detailed';
  interactivity: 'read-only' | 'interactive' | 'full-control';
  updateFrequency: number;
  customizations: Record<string, any>;
}

export interface GovernanceState {
  isLoading: boolean;
  hasErrors: boolean;
  errors: string[];
  lastUpdated: Date;
  data: GovernanceData;
}

export interface ContextRequirements {
  requiredPermissions: string[];
  minimumTrustLevel: number;
  supportedLayouts: string[];
  dependencies: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Subscription {
  subscriptionId: string;
  isActive: boolean;
  callback: ChangeCallback;
  filters: Record<string, any>;
  createdAt: Date;
}

export type ChangeCallback = (change: DataChange) => void;

export interface SyncStatus {
  isHealthy: boolean;
  activeConnections: number;
  lastHeartbeat: Date;
  latency: number;
  throughput: number;
}

export interface IntegrityResult {
  isValid: boolean;
  violations: IntegrityViolation[];
  confidence: number;
  timestamp: Date;
}

export interface IntegrityViolation {
  violationType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedData: string[];
}

export interface InconsistencyReport {
  reportId: string;
  inconsistencies: DataInconsistency[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedSystems: string[];
  timestamp: Date;
}

export interface RecoveryResult {
  success: boolean;
  recoveredEntities: string[];
  failedEntities: string[];
  errors: string[];
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface Configuration {
  configId: string;
  version: string;
  policies: Policy[];
  behavioralParameters: BehavioralParameters;
  syncSettings: SyncSettings;
  uiSettings: UISettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BehavioralParameters {
  trustThresholds: TrustThresholds;
  autonomySettings: AutonomySettings;
  complianceSettings: ComplianceSettings;
  emotionalSettings: EmotionalSettings;
}

export interface TrustThresholds {
  minimumTrust: number;
  autoApprovalThreshold: number;
  warningThreshold: number;
  suspensionThreshold: number;
}

export interface AutonomySettings {
  defaultLevel: AutonomyLevel;
  escalationThresholds: Record<string, number>;
  timeoutSettings: Record<string, number>;
  permissionDefaults: Permission[];
}

export interface ComplianceSettings {
  strictMode: boolean;
  autoEnforcement: boolean;
  violationHandling: 'warn' | 'block' | 'escalate';
  auditRetention: number;
}

export interface EmotionalSettings {
  empathyLevel: number;
  emotionalSafetyRequired: boolean;
  emotionalIntelligenceThreshold: number;
  responseAdaptation: boolean;
}

export interface SyncSettings {
  realTimeSync: boolean;
  syncInterval: number;
  retryAttempts: number;
  timeoutMs: number;
  priorityHandling: boolean;
}

export interface UISettings {
  defaultTheme: 'light' | 'dark';
  governanceVisibility: 'minimal' | 'standard' | 'detailed';
  updateFrequency: number;
  animationsEnabled: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  confidence: number;
}

export interface ValidationError {
  errorType: string;
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationWarning {
  warningType: string;
  field: string;
  message: string;
  recommendation: string;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  incompatibilities: Incompatibility[];
  recommendations: string[];
  confidence: number;
}

export interface Incompatibility {
  incompatibilityType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution: string;
}

export interface ConfigurationSnapshot {
  snapshotId: string;
  configuration: Configuration;
  timestamp: Date;
  description: string;
  createdBy: string;
}

export interface RollbackResult {
  success: boolean;
  rolledBackEntities: string[];
  failedEntities: string[];
  errors: string[];
  timestamp: Date;
}


// ============================================================================
// COMPLIANCE METRICS TYPES
// ============================================================================

export interface ComplianceMetrics {
  agentId: string;
  timeframe: {
    start: Date;
    end: Date;
  };
  overallComplianceRate: number;
  totalInteractions: number;
  compliantInteractions: number;
  violations: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  warnings: {
    total: number;
    acknowledged: number;
    pending: number;
  };
  policyBreakdown: PolicyComplianceBreakdown[];
  trends: {
    complianceRateChange: number;
    violationTrend: 'increasing' | 'decreasing' | 'stable';
    improvementAreas: string[];
  };
  lastUpdated: Date;
}

export interface PolicyComplianceBreakdown {
  policyId: string;
  complianceRate: number;
  violations: number;
  warnings: number;
}

export interface ComplianceTrend {
  period: {
    start: Date;
    end: Date;
  };
  complianceRate: number;
  violations: number;
  warnings: number;
  interactions: number;
}


// ============================================================================
// COGNITIVE ANALYSIS TYPES
// ============================================================================

export interface CognitiveAnalysis {
  reasoningDepth: number;
  confidenceLevel: number;
  uncertaintyLevel: number;
  complexityAssessment: number;
  qualityScore: number;
}

