/**
 * Governance Engine Types
 * 
 * This module defines types and interfaces specifically for the governance engine
 * that provides policy enforcement, trust management, and audit logging.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

/**
 * Governance engine configuration
 */
export interface GovernanceEngineConfig {
  agentId: string;
  userId: string;
  policies: PolicyDefinition[];
  trustConfig: TrustConfiguration;
  auditConfig: AuditConfiguration;
  performanceConfig: PerformanceConfiguration;
  debugMode: boolean;
}

/**
 * Performance configuration for governance engine
 */
export interface PerformanceConfiguration {
  maxProcessingTime: number; // milliseconds
  enableCaching: boolean;
  cacheSize: number; // number of cached evaluations
  batchSize: number; // for batch processing
  parallelProcessing: boolean;
  timeoutHandling: 'fail' | 'allow' | 'retry';
}

/**
 * Policy enforcement engine interface
 */
export interface PolicyEnforcer {
  checkCompliance(interaction: AgentInteraction): Promise<PolicyCheckResult>;
  validateResult(result: any): Promise<PolicyValidationResult>;
  enforcePolicy(policyId: string, interaction: AgentInteraction): Promise<PolicyEnforcementResult>;
  updatePolicies(policies: PolicyDefinition[]): Promise<void>;
  getPolicyStatus(policyId: string): Promise<PolicyStatus>;
}

/**
 * Trust management engine interface
 */
export interface TrustManager {
  getTrustScore(agentId: string): Promise<number>;
  updateTrustScore(agentId: string, interaction: AgentInteraction, result: any): Promise<number>;
  getMinimumThreshold(): number;
  evaluateTrustFactors(agentId: string): Promise<TrustEvaluation>;
  resetTrustScore(agentId: string, reason: string): Promise<void>;
  getTrustHistory(agentId: string, days?: number): Promise<TrustHistoryEntry[]>;
}

/**
 * Audit logging engine interface
 */
export interface AuditLogger {
  logGovernanceEvent(event: GovernanceEvent): Promise<string>;
  logInteraction(interaction: AgentInteraction, result: GovernedInteractionResult): Promise<string>;
  logPolicyViolation(violation: PolicyViolation): Promise<string>;
  logTrustScoreChange(change: TrustScoreChange): Promise<string>;
  queryLogs(query: AuditLogQuery): Promise<AuditLogEntry[]>;
  exportLogs(filters: AuditLogFilters): Promise<string>; // Returns export file path
}

/**
 * Compliance monitoring engine interface
 */
export interface ComplianceMonitor {
  startMonitoring(interaction: AgentInteraction): ComplianceMonitorSession;
  checkRateLimit(agentId: string): Promise<RateLimitResult>;
  getComplianceReport(agentId: string, period: TimePeriod): Promise<ComplianceReport>;
  detectAnomalies(agentId: string): Promise<AnomalyDetectionResult>;
}

/**
 * Policy validation result
 */
export interface PolicyValidationResult {
  valid: boolean;
  issues: PolicyIssue[];
  modifications?: Record<string, any>;
  confidence: number;
}

/**
 * Policy enforcement result
 */
export interface PolicyEnforcementResult {
  enforced: boolean;
  action: 'allowed' | 'blocked' | 'modified' | 'warned';
  modifications?: Record<string, any>;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Policy status information
 */
export interface PolicyStatus {
  id: string;
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  violationCount: number;
  effectiveness: number; // 0-1 score
  performance: {
    averageProcessingTime: number;
    errorRate: number;
  };
}

/**
 * Policy issue detected during validation
 */
export interface PolicyIssue {
  type: 'violation' | 'warning' | 'recommendation';
  policyId: string;
  ruleId?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedAction?: string;
}

/**
 * Trust evaluation result
 */
export interface TrustEvaluation {
  currentScore: number;
  previousScore: number;
  change: number;
  factors: TrustFactorEvaluation[];
  recommendations: string[];
  nextEvaluation: Date;
}

/**
 * Individual trust factor evaluation
 */
export interface TrustFactorEvaluation {
  name: string;
  score: number; // 0-100
  weight: number;
  contribution: number; // weighted contribution to overall score
  trend: 'improving' | 'stable' | 'declining';
  details?: Record<string, any>;
}

/**
 * Trust score history entry
 */
export interface TrustHistoryEntry {
  timestamp: Date;
  score: number;
  change: number;
  reason: string;
  factors: Record<string, number>;
  metadata?: Record<string, any>;
}

/**
 * Trust score change event
 */
export interface TrustScoreChange {
  agentId: string;
  previousScore: number;
  newScore: number;
  change: number;
  reason: string;
  factors: Record<string, number>;
  timestamp: Date;
  triggeredBy: string; // interaction ID or system event
}

/**
 * Governance event for audit logging
 */
export interface GovernanceEvent {
  id: string;
  type: 'policy_check' | 'trust_update' | 'violation' | 'emergency' | 'system';
  agentId: string;
  userId?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  data: Record<string, any>;
  context?: Record<string, any>;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  type: string;
  agentId: string;
  userId?: string;
  event: GovernanceEvent;
  metadata: Record<string, any>;
}

/**
 * Audit log query parameters
 */
export interface AuditLogQuery {
  agentId?: string;
  userId?: string;
  type?: string;
  severity?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'type';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit log filters for export
 */
export interface AuditLogFilters {
  agentIds?: string[];
  userIds?: string[];
  types?: string[];
  severities?: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv' | 'pdf';
  includeMetadata: boolean;
}

/**
 * Compliance monitoring session
 */
export interface ComplianceMonitorSession {
  id: string;
  agentId: string;
  startTime: Date;
  recordSuccess(): void;
  recordError(error: Error): void;
  recordWarning(warning: string): void;
  stop(): ComplianceMonitorResult;
}

/**
 * Compliance monitoring result
 */
export interface ComplianceMonitorResult {
  sessionId: string;
  duration: number; // milliseconds
  success: boolean;
  errors: Error[];
  warnings: string[];
  metrics: Record<string, number>;
}

/**
 * Rate limiting result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  limit: number;
  window: number; // seconds
}

/**
 * Time period specification
 */
export interface TimePeriod {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Compliance report
 */
export interface ComplianceReport {
  agentId: string;
  period: TimePeriod;
  summary: {
    totalInteractions: number;
    policyViolations: number;
    trustScoreAverage: number;
    complianceRate: number; // 0-1
  };
  policyCompliance: PolicyComplianceMetrics[];
  trustMetrics: TrustMetrics;
  violations: PolicyViolation[];
  recommendations: string[];
  generatedAt: Date;
}

/**
 * Policy compliance metrics
 */
export interface PolicyComplianceMetrics {
  policyId: string;
  policyName: string;
  totalChecks: number;
  violations: number;
  complianceRate: number; // 0-1
  averageProcessingTime: number;
  trend: 'improving' | 'stable' | 'declining';
}

/**
 * Trust metrics summary
 */
export interface TrustMetrics {
  currentScore: number;
  averageScore: number;
  minimumScore: number;
  maximumScore: number;
  volatility: number; // standard deviation
  trend: 'improving' | 'stable' | 'declining';
  factorBreakdown: Record<string, number>;
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetectionResult {
  anomaliesDetected: boolean;
  anomalies: Anomaly[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  confidence: number; // 0-1
}

/**
 * Detected anomaly
 */
export interface Anomaly {
  type: 'behavior' | 'performance' | 'compliance' | 'trust';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  firstDetected: Date;
  lastDetected: Date;
  frequency: number;
  context: Record<string, any>;
  suggestedActions: string[];
}

/**
 * Governance engine metrics
 */
export interface GovernanceEngineMetrics {
  agentId: string;
  uptime: number; // milliseconds
  totalInteractions: number;
  averageProcessingTime: number;
  errorRate: number;
  policyChecksPerformed: number;
  violationsDetected: number;
  trustScoreUpdates: number;
  auditLogsGenerated: number;
  performance: {
    cpu: number; // percentage
    memory: number; // bytes
    latency: number; // milliseconds
  };
  lastUpdated: Date;
}

/**
 * Emergency control state
 */
export interface EmergencyControlState {
  agentId: string;
  status: 'normal' | 'warning' | 'critical' | 'suspended';
  activeTriggers: string[];
  lastTriggered?: Date;
  actionsExecuted: string[];
  notificationsSent: number;
  canRecover: boolean;
  recoveryConditions: string[];
}

/**
 * Governance engine factory configuration
 */
export interface GovernanceEngineFactory {
  createEngine(config: GovernanceEngineConfig): Promise<GovernanceEngine>;
  validateConfig(config: GovernanceEngineConfig): Promise<ConfigValidationResult>;
  getDefaultConfig(): GovernanceEngineConfig;
  getSupportedPolicyTypes(): string[];
  getSupportedTrustFactors(): string[];
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Main governance engine interface
 */
export interface GovernanceEngine {
  // Core functionality
  processInteraction(interaction: AgentInteraction): Promise<GovernedInteractionResult>;
  updateConfiguration(config: Partial<GovernanceEngineConfig>): Promise<void>;
  getStatus(): Promise<GovernanceEngineState>;
  
  // Component access
  getPolicyEnforcer(): PolicyEnforcer;
  getTrustManager(): TrustManager;
  getAuditLogger(): AuditLogger;
  getComplianceMonitor(): ComplianceMonitor;
  
  // Control operations
  suspend(reason: string): Promise<void>;
  resume(): Promise<void>;
  reset(): Promise<void>;
  
  // Metrics and monitoring
  getMetrics(): Promise<GovernanceEngineMetrics>;
  getEmergencyState(): Promise<EmergencyControlState>;
  
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
}

export default {
  // Export all interfaces for easy importing
  GovernanceEngineConfig,
  PerformanceConfiguration,
  PolicyEnforcer,
  TrustManager,
  AuditLogger,
  ComplianceMonitor,
  PolicyValidationResult,
  PolicyEnforcementResult,
  PolicyStatus,
  PolicyIssue,
  TrustEvaluation,
  TrustFactorEvaluation,
  TrustHistoryEntry,
  TrustScoreChange,
  GovernanceEvent,
  AuditLogEntry,
  AuditLogQuery,
  AuditLogFilters,
  ComplianceMonitorSession,
  ComplianceMonitorResult,
  RateLimitResult,
  TimePeriod,
  ComplianceReport,
  PolicyComplianceMetrics,
  TrustMetrics,
  AnomalyDetectionResult,
  Anomaly,
  GovernanceEngineMetrics,
  EmergencyControlState,
  GovernanceEngineFactory,
  ConfigValidationResult,
  GovernanceEngine
};

