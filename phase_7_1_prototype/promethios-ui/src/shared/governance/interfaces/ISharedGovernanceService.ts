/**
 * Shared Governance Service Interfaces
 * 
 * Standardized interfaces for the synchronized governance architecture.
 * These interfaces ensure consistent behavior across both modern chat 
 * and universal governance systems.
 */

import {
  GovernanceContext,
  AgentAction,
  AgentResponse,
  PolicyEnforcementResult,
  PolicyAssignment,
  ComplianceResult,
  TrustScore,
  TrustEvent,
  TrustHistory,
  AuditEntry,
  AuditFilters,
  BehavioralPatterns,
  AutonomyRequest,
  AutonomyAssessment,
  AutonomyLevel,
  PermissionSet,
  SelfAwarenessPrompt,
  PerformanceReflection,
  TrustGuidance,
  SelfQuestion,
  MessageContext,
  SensitivityAssessment,
  CompliancePreCheck,
  EnhancedResponse,
  EmotionalContext,
  DataChange,
  SyncTarget,
  SyncResult,
  ConsistencyResult,
  DataConflict,
  ConflictResolution,
  Configuration,
  BehavioralParameters,
  ValidationResult,
  CompatibilityResult,
  Policy
} from '../types/SharedGovernanceTypes';

// ============================================================================
// CORE GOVERNANCE SERVICE INTERFACE
// ============================================================================

export interface ISharedGovernanceService {
  // Policy enforcement
  enforcePolicy(context: GovernanceContext, action: AgentAction): Promise<PolicyEnforcementResult>;
  getPolicyAssignments(agentId: string): Promise<PolicyAssignment[]>;
  validateCompliance(context: GovernanceContext, response: AgentResponse): Promise<ComplianceResult>;
  
  // Trust management
  calculateTrustScore(agentId: string, context: GovernanceContext): Promise<TrustScore>;
  updateTrustScore(agentId: string, trustEvent: TrustEvent): Promise<void>;
  getTrustHistory(agentId: string): Promise<TrustHistory>;
  
  // Audit logging
  logInteraction(interaction: Partial<AuditEntry>): Promise<AuditEntry>;
  getAuditHistory(agentId: string, filters?: AuditFilters): Promise<AuditEntry[]>;
  analyzeAuditPatterns(agentId: string): Promise<BehavioralPatterns>;
  
  // Autonomous cognition
  assessAutonomyRequest(request: AutonomyRequest): Promise<AutonomyAssessment>;
  managePermissions(agentId: string, permissions: PermissionSet): Promise<void>;
  getAutonomyLevel(agentId: string): Promise<AutonomyLevel>;
  
  // Context management
  createGovernanceContext(agentId: string, userId: string, environment: string): Promise<GovernanceContext>;
  updateGovernanceContext(context: GovernanceContext): Promise<GovernanceContext>;
  validateGovernanceContext(context: GovernanceContext): Promise<ValidationResult>;
}

// ============================================================================
// CHAIN OF THOUGHT SERVICE INTERFACE
// ============================================================================

export interface IChainOfThoughtService {
  // Self-awareness prompts
  generateSelfAwarenessPrompts(context: GovernanceContext): Promise<SelfAwarenessPrompt[]>;
  generatePerformanceReflection(agentId: string): Promise<PerformanceReflection>;
  generateTrustGuidance(trustScore: TrustScore): Promise<TrustGuidance>;
  
  // Pre-response self-questioning
  generateSelfQuestions(context: MessageContext): Promise<SelfQuestion[]>;
  assessTopicSensitivity(content: string): Promise<SensitivityAssessment>;
  performCompliancePreCheck(response: string, policies: Policy[]): Promise<CompliancePreCheck>;
  
  // Governance context injection
  createGovernanceContext(agentId: string, userContext: any): Promise<GovernanceContext>;
  injectGovernancePrompts(basePrompt: string, context: GovernanceContext): Promise<string>;
  enhanceResponseWithGovernance(response: string, context: GovernanceContext): Promise<EnhancedResponse>;
  
  // Reasoning analysis
  analyzeReasoningDepth(response: string): Promise<number>;
  assessConfidenceLevel(response: string, context: GovernanceContext): Promise<number>;
  calculateUncertaintyLevel(response: string, context: GovernanceContext): Promise<number>;
}

// ============================================================================
// POLICY ENFORCEMENT SERVICE INTERFACE
// ============================================================================

export interface IPolicyEnforcementService {
  // Policy management
  loadPolicies(): Promise<Policy[]>;
  getPolicyById(policyId: string): Promise<Policy | null>;
  validatePolicy(policy: Policy): Promise<ValidationResult>;
  
  // Policy assignment
  assignPolicyToAgent(agentId: string, policyId: string): Promise<PolicyAssignment>;
  removePolicyFromAgent(agentId: string, policyId: string): Promise<void>;
  getAgentPolicyAssignments(agentId: string): Promise<PolicyAssignment[]>;
  
  // Compliance checking
  checkCompliance(content: string, policies: Policy[]): Promise<ComplianceResult>;
  validateResponse(response: AgentResponse, context: GovernanceContext): Promise<ComplianceResult>;
  preCheckCompliance(plannedResponse: string, context: GovernanceContext): Promise<CompliancePreCheck>;
  
  // Violation handling
  handlePolicyViolation(violation: any, context: GovernanceContext): Promise<void>;
  escalateViolation(violation: any, context: GovernanceContext): Promise<void>;
  recordViolation(violation: any, context: GovernanceContext): Promise<void>;
}

// ============================================================================
// TRUST MANAGEMENT SERVICE INTERFACE
// ============================================================================

export interface ITrustManagementService {
  // Trust calculation
  calculateTrustScore(agentId: string, context?: GovernanceContext): Promise<TrustScore>;
  updateTrustScore(agentId: string, event: TrustEvent): Promise<TrustScore>;
  getTrustTrend(agentId: string, timeframe: string): Promise<string>;
  
  // Trust history
  getTrustHistory(agentId: string, limit?: number): Promise<TrustHistory>;
  addTrustEvent(agentId: string, event: TrustEvent): Promise<void>;
  analyzeTrustPatterns(agentId: string): Promise<any>;
  
  // Trust thresholds
  checkTrustThreshold(agentId: string, requiredLevel: number): Promise<boolean>;
  getAutonomyThreshold(agentId: string): Promise<number>;
  validateTrustLevel(trustScore: number, context: GovernanceContext): Promise<boolean>;
  
  // Cross-context trust
  synchronizeTrustAcrossContexts(agentId: string, trustScore: TrustScore): Promise<void>;
  getTrustScoreFromAllContexts(agentId: string): Promise<TrustScore[]>;
  consolidateTrustScores(scores: TrustScore[]): Promise<TrustScore>;
}

// ============================================================================
// AUDIT LOGGING SERVICE INTERFACE
// ============================================================================

export interface IAuditLoggingService {
  // Audit entry management
  createAuditEntry(interaction: Partial<AuditEntry>): Promise<AuditEntry>;
  getAuditEntry(interactionId: string): Promise<AuditEntry | null>;
  updateAuditEntry(interactionId: string, updates: Partial<AuditEntry>): Promise<AuditEntry>;
  
  // Audit history
  getAuditHistory(agentId: string, filters?: AuditFilters): Promise<AuditEntry[]>;
  getAuditHistoryByUser(userId: string, filters?: AuditFilters): Promise<AuditEntry[]>;
  getAuditHistoryBySession(sessionId: string): Promise<AuditEntry[]>;
  
  // Behavioral analysis
  analyzeBehavioralPatterns(agentId: string): Promise<BehavioralPatterns>;
  generateLearningInsights(agentId: string): Promise<any[]>;
  identifyAnomalies(agentId: string): Promise<any[]>;
  
  // Audit integrity
  validateAuditIntegrity(auditEntry: AuditEntry): Promise<boolean>;
  generateCryptographicHash(auditEntry: AuditEntry): Promise<string>;
  verifyAuditChain(entries: AuditEntry[]): Promise<boolean>;
  
  // Cross-context audit
  synchronizeAuditEntry(entry: AuditEntry, targets: string[]): Promise<void>;
  getAuditEntriesFromAllContexts(agentId: string): Promise<AuditEntry[]>;
  consolidateAuditData(entries: AuditEntry[]): Promise<BehavioralPatterns>;
}

// ============================================================================
// AUTONOMOUS COGNITION SERVICE INTERFACE
// ============================================================================

export interface IAutonomousCognitionService {
  // Autonomy assessment
  assessAutonomyRequest(request: AutonomyRequest): Promise<AutonomyAssessment>;
  calculateRiskLevel(request: AutonomyRequest): Promise<string>;
  determinePermissionRequired(request: AutonomyRequest): Promise<boolean>;
  
  // Permission management
  requestPermission(agentId: string, request: AutonomyRequest): Promise<AutonomyAssessment>;
  grantPermission(agentId: string, assessment: AutonomyAssessment): Promise<void>;
  revokePermission(agentId: string, permissionType: string): Promise<void>;
  
  // Autonomy monitoring
  monitorAutonomousActivity(agentId: string): Promise<any>;
  detectAutonomousThinking(content: string): Promise<boolean>;
  trackAutonomyUsage(agentId: string): Promise<any>;
  
  // Trust-based autonomy
  calculateAutonomyLevel(trustScore: TrustScore): Promise<AutonomyLevel>;
  adjustAutonomyBasedOnTrust(agentId: string, trustScore: TrustScore): Promise<AutonomyLevel>;
  validateAutonomyPermission(agentId: string, trustScore: TrustScore, request: AutonomyRequest): Promise<boolean>;
}

// ============================================================================
// EMOTIONAL INTELLIGENCE SERVICE INTERFACE
// ============================================================================

export interface IEmotionalIntelligenceService {
  // Emotional analysis
  analyzeUserEmotionalState(content: string, context: any): Promise<any>;
  generateEmotionalResponse(userEmotion: string, context: GovernanceContext): Promise<any>;
  assessEmotionalAppropriateness(response: string, context: EmotionalContext): Promise<number>;
  
  // Empathy and support
  demonstrateEmpathy(userEmotion: string, context: GovernanceContext): Promise<string>;
  provideEmotionalSupport(userState: any, context: GovernanceContext): Promise<string>;
  maintainEmotionalSafety(interaction: any): Promise<boolean>;
  
  // Emotional intelligence scoring
  calculateEmotionalIntelligenceScore(agentId: string): Promise<number>;
  trackEmotionalPerformance(agentId: string): Promise<any>;
  improveEmotionalResponse(agentId: string, feedback: any): Promise<void>;
}

// ============================================================================
// SYNCHRONIZATION SERVICE INTERFACE
// ============================================================================

export interface ISynchronizationService {
  // Data synchronization
  propagateChange(change: DataChange, targets: SyncTarget[]): Promise<SyncResult>;
  validateDataConsistency(data: any): Promise<ConsistencyResult>;
  resolveConflicts(conflicts: DataConflict[]): Promise<ConflictResolution>;
  
  // Real-time synchronization
  subscribeToChanges(target: SyncTarget, callback: (change: DataChange) => void): Promise<any>;
  publishChange(change: DataChange): Promise<void>;
  getRealtimeStatus(): Promise<any>;
  
  // Consistency guarantees
  ensureEventualConsistency(data: any): Promise<void>;
  verifyDataIntegrity(data: any): Promise<any>;
  recoverFromInconsistency(inconsistency: any): Promise<any>;
  
  // Cross-context coordination
  coordinateAcrossContexts(operation: string, data: any): Promise<any>;
  validateCrossContextConsistency(): Promise<boolean>;
  synchronizeGovernanceState(agentId: string): Promise<void>;
}

// ============================================================================
// CONFIGURATION SERVICE INTERFACE
// ============================================================================

export interface IConfigurationService {
  // Configuration management
  loadConfiguration(): Promise<Configuration>;
  updateConfiguration(config: Configuration): Promise<void>;
  validateConfiguration(config: Configuration): Promise<ValidationResult>;
  
  // Policy synchronization
  syncPolicyUpdates(policies: Policy[], targets: SyncTarget[]): Promise<SyncResult>;
  validatePolicyConsistency(policies: Policy[]): Promise<ValidationResult>;
  resolvePolicyConflicts(conflicts: any[]): Promise<any>;
  
  // Parameter synchronization
  syncBehavioralParameters(parameters: BehavioralParameters, targets: SyncTarget[]): Promise<SyncResult>;
  validateParameterCompatibility(parameters: BehavioralParameters, context: any): Promise<CompatibilityResult>;
  adaptParametersToContext(parameters: BehavioralParameters, context: any): Promise<BehavioralParameters>;
  
  // Configuration validation
  testConfigurationCompatibility(config: Configuration, targets: SyncTarget[]): Promise<CompatibilityResult>;
  rollbackConfiguration(rollbackPoint: any): Promise<any>;
  createConfigurationSnapshot(description: string): Promise<any>;
}

// ============================================================================
// UI COMPONENT SERVICE INTERFACE
// ============================================================================

export interface IGovernanceUIService {
  // Component lifecycle
  initializeComponent(componentType: string, context: any): Promise<any>;
  renderComponent(componentType: string, props: any): Promise<any>;
  updateComponent(componentId: string, newProps: any): Promise<void>;
  destroyComponent(componentId: string): Promise<void>;
  
  // Governance integration
  bindGovernanceData(componentId: string, data: any): Promise<void>;
  handleGovernanceEvent(componentId: string, event: any): Promise<void>;
  updateGovernanceState(componentId: string, state: any): Promise<void>;
  
  // Context adaptation
  adaptToContext(componentId: string, context: any): Promise<any>;
  validateContextCompatibility(componentType: string, context: any): Promise<boolean>;
  getContextRequirements(componentType: string): Promise<any>;
  
  // Cross-context UI synchronization
  synchronizeUIState(componentType: string, state: any): Promise<void>;
  propagateUIChanges(componentId: string, changes: any): Promise<void>;
  validateUIConsistency(componentType: string): Promise<boolean>;
}

// ============================================================================
// EXTENSION SERVICE INTERFACE
// ============================================================================

export interface IExtensionService {
  // Extension management
  loadExtension(extensionId: string): Promise<any>;
  unloadExtension(extensionId: string): Promise<void>;
  getExtensionStatus(extensionId: string): Promise<any>;
  
  // Extension communication
  sendMessageToExtension(extensionId: string, message: any): Promise<any>;
  receiveMessageFromExtension(extensionId: string, handler: (message: any) => void): Promise<void>;
  broadcastToExtensions(message: any): Promise<void>;
  
  // Extension synchronization
  synchronizeExtensionState(extensionId: string, state: any): Promise<void>;
  validateExtensionCompatibility(extensionId: string, context: any): Promise<boolean>;
  updateExtensionAcrossContexts(extensionId: string, update: any): Promise<void>;
}

// ============================================================================
// PERFORMANCE MONITORING SERVICE INTERFACE
// ============================================================================

export interface IPerformanceMonitoringService {
  // Performance tracking
  trackOperationPerformance(operation: string, duration: number): Promise<void>;
  getPerformanceMetrics(timeframe: string): Promise<any>;
  analyzePerformanceTrends(): Promise<any>;
  
  // Resource monitoring
  monitorResourceUsage(): Promise<any>;
  trackMemoryUsage(): Promise<any>;
  monitorNetworkLatency(): Promise<any>;
  
  // Optimization
  identifyPerformanceBottlenecks(): Promise<any>;
  suggestOptimizations(): Promise<any>;
  implementAutomaticOptimizations(): Promise<void>;
  
  // Cross-context performance
  comparePerformanceAcrossContexts(): Promise<any>;
  optimizeForCrossContextOperations(): Promise<void>;
  balanceLoadAcrossContexts(): Promise<void>;
}

// ============================================================================
// FACTORY INTERFACE FOR SERVICE CREATION
// ============================================================================

export interface ISharedGovernanceServiceFactory {
  createGovernanceService(context: string): ISharedGovernanceService;
  createChainOfThoughtService(context: string): IChainOfThoughtService;
  createPolicyEnforcementService(context: string): IPolicyEnforcementService;
  createTrustManagementService(context: string): ITrustManagementService;
  createAuditLoggingService(context: string): IAuditLoggingService;
  createAutonomousCognitionService(context: string): IAutonomousCognitionService;
  createEmotionalIntelligenceService(context: string): IEmotionalIntelligenceService;
  createSynchronizationService(context: string): ISynchronizationService;
  createConfigurationService(context: string): IConfigurationService;
  createUIService(context: string): IGovernanceUIService;
  createExtensionService(context: string): IExtensionService;
  createPerformanceMonitoringService(context: string): IPerformanceMonitoringService;
}

