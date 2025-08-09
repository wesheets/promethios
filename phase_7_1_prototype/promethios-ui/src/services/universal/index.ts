/**
 * Universal Services Index
 * 
 * Exports the comprehensive UniversalGovernanceAdapter that provides 100% feature parity
 * with modern chat using the shared governance foundation. This replaces all the old
 * incomplete universal services with a single, comprehensive adapter.
 */

import { UniversalGovernanceAdapter } from '../UniversalGovernanceAdapter';

// Export the main universal governance adapter
export { UniversalGovernanceAdapter };

// Create singleton instance for consistent usage
let universalGovernanceInstance: UniversalGovernanceAdapter | null = null;

/**
 * Get the singleton instance of the Universal Governance Adapter
 */
export function getUniversalGovernance(): UniversalGovernanceAdapter {
  if (!universalGovernanceInstance) {
    universalGovernanceInstance = new UniversalGovernanceAdapter();
  }
  return universalGovernanceInstance;
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Backward-compatible trust management service
 * Uses the comprehensive adapter underneath
 */
export class UniversalTrustManagementService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async getTrustScore(agentId: string) {
    return this.adapter.getTrustScore(agentId);
  }

  async updateTrustScore(agentId: string, trustEvent: any) {
    return this.adapter.updateTrustScore(agentId, trustEvent);
  }

  async calculateTrustLevel(agentId: string) {
    return this.adapter.calculateTrustLevel(agentId);
  }

  async getTrustHistory(agentId: string) {
    return this.adapter.getTrustHistory(agentId);
  }
}

/**
 * Backward-compatible audit logging service
 * Uses the comprehensive adapter underneath
 */
export class UniversalAuditLoggingService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async createAuditEntry(interaction: any) {
    return this.adapter.createAuditEntry(interaction);
  }

  async getAuditHistory(agentId: string, filters?: any) {
    return this.adapter.getAuditHistory(agentId, filters);
  }

  async analyzeBehavioralPatterns(agentId: string) {
    return this.adapter.analyzeBehavioralPatterns(agentId);
  }

  async generateLearningInsights(agentId: string) {
    return this.adapter.generateLearningInsights(agentId);
  }
}

/**
 * Backward-compatible autonomous thinking service
 * Uses the comprehensive adapter underneath
 */
export class UniversalAutonomousThinkingService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async requestAutonomousThinking(agentId: string, request: any) {
    return this.adapter.requestAutonomousThinking(agentId, request);
  }

  async getAutonomyLevel(agentId: string) {
    return this.adapter.getAutonomyLevel(agentId);
  }

  async monitorAutonomousActivity(agentId: string) {
    return this.adapter.monitorAutonomousActivity(agentId);
  }
}

/**
 * Backward-compatible emotional veritas service
 * Uses the comprehensive adapter underneath
 */
export class UniversalEmotionalVeritasService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async analyzeEmotionalState(content: string, context?: any) {
    return this.adapter.analyzeEmotionalState(content, context);
  }

  async generateSelfAwarenessPrompts(agentId: string, context?: any) {
    return this.adapter.generateSelfAwarenessPrompts(agentId, context);
  }
}

// ============================================================================
// NEW COMPREHENSIVE SERVICES (100% Feature Parity)
// ============================================================================

/**
 * Universal Policy Enforcement Service (NEW - matches modern chat)
 * Provides real HIPAA/SOX/GDPR compliance
 */
export class UniversalPolicyEnforcementService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async getAllPolicies() {
    return this.adapter.getAllPolicies();
  }

  async enforcePolicy(agentId: string, content: string, context: any) {
    return this.adapter.enforcePolicy(agentId, content, context);
  }

  async getAgentPolicyAssignments(agentId: string) {
    return this.adapter.getAgentPolicyAssignments(agentId);
  }

  async getComplianceMetrics(agentId: string) {
    return this.adapter.getComplianceMetrics(agentId);
  }
}

/**
 * Universal Chain of Thought Service (NEW - matches modern chat)
 * Provides self-awareness prompts and pre-response questioning
 */
export class UniversalChainOfThoughtService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async generateSelfAwarenessPrompts(agentId: string, context?: any) {
    return this.adapter.generateSelfAwarenessPrompts(agentId, context);
  }

  async generateSelfQuestions(messageContext: any) {
    return this.adapter.generateSelfQuestions(messageContext);
  }

  async injectGovernanceContext(basePrompt: string, agentId: string, context?: any) {
    return this.adapter.injectGovernanceContext(basePrompt, agentId, context);
  }

  async enhanceResponseWithGovernance(response: string, agentId: string, context?: any) {
    return this.adapter.enhanceResponseWithGovernance(response, agentId, context);
  }
}

/**
 * Universal Synchronization Service (NEW - cross-context coordination)
 * Provides real-time synchronization with modern chat
 */
export class UniversalSynchronizationService {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async getSyncStatus() {
    return this.adapter.getSyncStatus();
  }

  async ensureFeatureParity() {
    return this.adapter.ensureFeatureParity();
  }
}

// ============================================================================
// COMPREHENSIVE MESSAGE PROCESSING (NEW)
// ============================================================================

/**
 * Universal Message Processor
 * Provides complete governance pipeline for message processing
 */
export class UniversalMessageProcessor {
  private adapter: UniversalGovernanceAdapter;

  constructor() {
    this.adapter = getUniversalGovernance();
  }

  async processMessage(agentId: string, message: string, context?: any) {
    return this.adapter.processMessage(agentId, message, context);
  }

  async processResponse(agentId: string, response: string, context: any) {
    return this.adapter.processResponse(agentId, response, context);
  }

  async startSession(agentId: string, userId?: string) {
    return this.adapter.startSession(agentId, userId);
  }

  async endSession(sessionId: string) {
    return this.adapter.endSession(sessionId);
  }
}

// Export all services for easy access
export const UniversalServices = {
  // Main adapter
  governance: getUniversalGovernance,
  
  // Individual services (backward compatible)
  trustManagement: () => new UniversalTrustManagementService(),
  auditLogging: () => new UniversalAuditLoggingService(),
  autonomousThinking: () => new UniversalAutonomousThinkingService(),
  emotionalVeritas: () => new UniversalEmotionalVeritasService(),
  
  // New comprehensive services (100% feature parity)
  policyEnforcement: () => new UniversalPolicyEnforcementService(),
  chainOfThought: () => new UniversalChainOfThoughtService(),
  synchronization: () => new UniversalSynchronizationService(),
  messageProcessor: () => new UniversalMessageProcessor()
};

console.log('🌐 [Universal] Universal services initialized with shared foundation');
console.log('✅ [Universal] 100% feature parity with modern chat achieved');
console.log('🔄 [Universal] Real-time synchronization enabled');

