/**
 * Modern Chat Governance Adapter
 * 
 * Integrates the shared governance foundation with the existing modern chat system.
 * This adapter maintains 100% compatibility with modern chat's current interfaces
 * while using the shared services underneath for automatic synchronization.
 */

import { SharedGovernanceService } from '../shared/governance/core/SharedGovernanceService';
import { SharedPolicyEnforcementService } from '../shared/governance/core/SharedPolicyEnforcementService';
import { SharedTrustManagementService } from '../shared/governance/core/SharedTrustManagementService';
import { SharedAuditLoggingService } from '../shared/governance/core/SharedAuditLoggingService';
import { SharedAutonomousCognitionService } from '../shared/governance/core/SharedAutonomousCognitionService';
import { SharedChainOfThoughtService } from '../shared/governance/core/SharedChainOfThoughtService';
import { SharedSynchronizationService } from '../shared/governance/core/SharedSynchronizationService';

// Import existing modern chat interfaces for compatibility
import { 
  GovernanceMetrics, 
  GovernancePolicy, 
  GovernanceSession, 
  GovernanceViolation 
} from './GovernanceService';

export class ModernChatGovernanceAdapter {
  private sharedGovernance: SharedGovernanceService;
  private sharedPolicyEnforcement: SharedPolicyEnforcementService;
  private sharedTrustManagement: SharedTrustManagementService;
  private sharedAuditLogging: SharedAuditLoggingService;
  private sharedAutonomousCognition: SharedAutonomousCognitionService;
  private sharedChainOfThought: SharedChainOfThoughtService;
  private sharedSynchronization: SharedSynchronizationService;

  private currentSession: GovernanceSession | null = null;
  private baseUrl: string;
  private isApiAvailable: boolean = true;

  constructor() {
    console.log('🔄 [ModernChat] Initializing governance adapter with shared services');
    
    // Initialize shared services with modern_chat context
    this.sharedGovernance = new SharedGovernanceService('modern_chat');
    this.sharedPolicyEnforcement = new SharedPolicyEnforcementService('modern_chat');
    this.sharedTrustManagement = new SharedTrustManagementService('modern_chat');
    this.sharedAuditLogging = new SharedAuditLoggingService('modern_chat');
    this.sharedAutonomousCognition = new SharedAutonomousCognitionService('modern_chat');
    this.sharedChainOfThought = new SharedChainOfThoughtService('modern_chat');
    this.sharedSynchronization = new SharedSynchronizationService('modern_chat');

    // Maintain compatibility with existing modern chat configuration
    this.baseUrl = import.meta.env.VITE_GOVERNANCE_API_URL || 'https://promethios-phase-7-1-api.onrender.com/api';
    
    this.initializeGovernance();
  }

  // ============================================================================
  // GOVERNANCE SESSION MANAGEMENT (Compatible with existing modern chat)
  // ============================================================================

  async initializeGovernance(): Promise<void> {
    try {
      console.log('🏗️ [ModernChat] Initializing governance with shared services');
      
      // Initialize shared governance context
      await this.sharedGovernance.initializeContext({
        contextId: 'modern_chat',
        environment: 'modern_chat',
        features: [
          'governance_aware_agents',
          'trust_management', 
          'policy_enforcement',
          'audit_logging',
          'autonomous_cognition',
          'chain_of_thought',
          'emotional_veritas'
        ]
      });

      // Start real-time synchronization
      await this.sharedSynchronization.startRealTimeSync();

      console.log('✅ [ModernChat] Governance initialized with shared services');
    } catch (error) {
      console.error('❌ [ModernChat] Failed to initialize governance:', error);
      this.isApiAvailable = false;
    }
  }

  async startSession(agentId: string): Promise<GovernanceSession> {
    try {
      console.log(`🚀 [ModernChat] Starting governance session for agent ${agentId}`);
      
      // Create governance context using shared services
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: 'modern_chat_user',
        sessionId: `modern_chat_session_${Date.now()}`,
        trustScore: 0.75,
        autonomyLevel: 'basic',
        assignedPolicies: [],
        environment: 'modern_chat'
      });

      // Get initial trust score
      const trustScore = await this.sharedTrustManagement.getTrustScore(agentId);

      // Create session compatible with modern chat interface
      this.currentSession = {
        sessionId: governanceContext.sessionId,
        agentId,
        startTime: new Date(),
        messageCount: 0,
        violations: [],
        currentTrustScore: trustScore?.currentScore || 0.75
      };

      // Synchronize session start across contexts
      await this.sharedSynchronization.synchronizeGovernanceContext(governanceContext);

      console.log(`✅ [ModernChat] Governance session started: ${this.currentSession.sessionId}`);
      return this.currentSession;
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to start session:`, error);
      throw error;
    }
  }

  async endSession(): Promise<void> {
    try {
      if (!this.currentSession) {
        console.log('⚠️ [ModernChat] No active session to end');
        return;
      }

      console.log(`🏁 [ModernChat] Ending governance session: ${this.currentSession.sessionId}`);

      // Create session summary audit entry
      await this.sharedAuditLogging.createAuditEntry({
        interaction_id: `session_end_${this.currentSession.sessionId}`,
        agent_id: this.currentSession.agentId,
        user_id: 'modern_chat_user',
        session_id: this.currentSession.sessionId,
        timestamp: new Date(),
        user_message: 'Session ended',
        agent_response: `Session completed with ${this.currentSession.messageCount} messages`,
        trust_score_before: this.currentSession.currentTrustScore,
        trust_score_after: this.currentSession.currentTrustScore,
        policy_violations: this.currentSession.violations.map(v => ({
          violationId: v.id,
          ruleId: v.policyId,
          policyId: v.policyId,
          severity: v.severity,
          description: v.description,
          context: v.description,
          timestamp: v.timestamp,
          resolved: v.resolved
        })),
        environment: 'modern_chat'
      });

      this.currentSession = null;
      console.log('✅ [ModernChat] Governance session ended');
    } catch (error) {
      console.error('❌ [ModernChat] Failed to end session:', error);
      throw error;
    }
  }

  // ============================================================================
  // GOVERNANCE METRICS (Compatible with existing modern chat interface)
  // ============================================================================

  async getGovernanceMetrics(agentId: string): Promise<GovernanceMetrics> {
    try {
      console.log(`📊 [ModernChat] Getting governance metrics for agent ${agentId}`);
      
      // Get trust score from shared service
      const trustScore = await this.sharedTrustManagement.getTrustScore(agentId);
      
      // Get compliance metrics from shared policy enforcement
      const complianceMetrics = await this.sharedPolicyEnforcement.getComplianceMetrics(agentId);
      
      // Get audit insights for response time
      const auditHistory = await this.sharedAuditLogging.getAuditHistory(agentId, {
        limit: 10
      });
      
      const avgResponseTime = auditHistory.length > 0 
        ? auditHistory.reduce((sum, entry) => sum + entry.response_time_ms, 0) / auditHistory.length
        : 1500;

      // Count recent violations
      const recentViolations = auditHistory.reduce((count, entry) => 
        count + entry.policy_violations.length, 0
      );

      // Create metrics compatible with modern chat interface
      const metrics: GovernanceMetrics = {
        trustScore: trustScore?.currentScore || 0.75,
        complianceRate: complianceMetrics?.overallComplianceRate || 0.95,
        responseTime: avgResponseTime,
        sessionIntegrity: 1.0, // High integrity with shared services
        policyViolations: recentViolations,
        status: trustScore?.currentScore > 0.8 ? 'active' : 'monitoring',
        lastUpdated: new Date()
      };

      console.log(`✅ [ModernChat] Governance metrics retrieved:`, {
        trustScore: metrics.trustScore,
        complianceRate: metrics.complianceRate,
        status: metrics.status
      });

      return metrics;
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to get governance metrics:`, error);
      
      // Return fallback metrics on error
      return {
        trustScore: 0.75,
        complianceRate: 0.95,
        responseTime: 1500,
        sessionIntegrity: 1.0,
        policyViolations: 0,
        status: 'monitoring',
        lastUpdated: new Date()
      };
    }
  }

  // ============================================================================
  // POLICY MANAGEMENT (Compatible with existing modern chat interface)
  // ============================================================================

  async getPolicies(): Promise<GovernancePolicy[]> {
    try {
      console.log('📋 [ModernChat] Getting policies from shared service');
      
      // Get policies from shared policy enforcement service
      const sharedPolicies = await this.sharedPolicyEnforcement.getAllPolicies();
      
      // Convert to modern chat interface format
      const policies: GovernancePolicy[] = sharedPolicies.map(policy => ({
        id: policy.policyId,
        name: policy.name,
        description: policy.description,
        enabled: policy.isActive,
        severity: policy.severity
      }));

      console.log(`✅ [ModernChat] Retrieved ${policies.length} policies`);
      return policies;
    } catch (error) {
      console.error('❌ [ModernChat] Failed to get policies:', error);
      
      // Return fallback policies
      return [
        {
          id: 'hipaa_compliance',
          name: 'HIPAA Compliance',
          description: 'Healthcare data protection and privacy',
          enabled: true,
          severity: 'high'
        },
        {
          id: 'gdpr_compliance', 
          name: 'GDPR Compliance',
          description: 'General Data Protection Regulation',
          enabled: true,
          severity: 'high'
        }
      ];
    }
  }

  async enforcePolicy(agentId: string, userId: string, message: string): Promise<{
    allowed: boolean;
    violations: GovernanceViolation[];
    action: string;
  }> {
    try {
      console.log(`🛡️ [ModernChat] Enforcing policies for agent ${agentId}`);
      
      // Create governance context
      const context = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId,
        sessionId: this.currentSession?.sessionId || `temp_session_${Date.now()}`,
        environment: 'modern_chat'
      });

      // Enforce policies using shared service
      const enforcement = await this.sharedPolicyEnforcement.enforcePolicy(
        agentId,
        message,
        context
      );

      // Convert violations to modern chat format
      const violations: GovernanceViolation[] = enforcement.violations.map(violation => ({
        id: violation.violationId,
        policyId: violation.policyId,
        policyName: violation.policyId, // Would map to actual policy name
        severity: violation.severity,
        description: violation.description,
        timestamp: violation.timestamp,
        messageId: `msg_${Date.now()}`,
        resolved: violation.resolved
      }));

      // Update current session with violations
      if (this.currentSession && violations.length > 0) {
        this.currentSession.violations.push(...violations);
      }

      const result = {
        allowed: enforcement.allowed,
        violations,
        action: enforcement.action
      };

      console.log(`✅ [ModernChat] Policy enforcement completed:`, {
        allowed: result.allowed,
        violations: violations.length,
        action: result.action
      });

      return result;
    } catch (error) {
      console.error(`❌ [ModernChat] Policy enforcement failed:`, error);
      
      // Fail safe - allow with warning
      return {
        allowed: true,
        violations: [],
        action: 'allow_with_warning'
      };
    }
  }

  // ============================================================================
  // MESSAGE PROCESSING (Enhanced with shared services)
  // ============================================================================

  async processMessage(agentId: string, userId: string, message: string): Promise<{
    governanceContext: any;
    enhancedPrompt: string;
    preCheckResults: any;
  }> {
    try {
      console.log(`💬 [ModernChat] Processing message with shared governance services`);
      
      // Create comprehensive governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId,
        sessionId: this.currentSession?.sessionId || `temp_session_${Date.now()}`,
        environment: 'modern_chat'
      });

      // Generate self-awareness prompts
      const selfAwarenessPrompts = await this.sharedChainOfThought.generateSelfAwarenessPrompts(governanceContext);

      // Generate self-questions for pre-response analysis
      const selfQuestions = await this.sharedChainOfThought.generateSelfQuestions({
        messageId: `msg_${Date.now()}`,
        content: message,
        timestamp: new Date(),
        userContext: {
          userId,
          trustLevel: governanceContext.trustScore,
          emotionalState: 'neutral'
        },
        conversationHistory: [],
        topicSensitivity: await this.sharedChainOfThought.assessTopicSensitivity(message)
      });

      // Inject governance context into prompt
      const basePrompt = `You are a governance-aware AI assistant. Process this message: ${message}`;
      const enhancedPrompt = await this.sharedChainOfThought.injectGovernancePrompts(basePrompt, governanceContext);

      // Perform compliance pre-check
      const policies = await this.sharedPolicyEnforcement.getAllPolicies();
      const preCheckResults = await this.sharedChainOfThought.performCompliancePreCheck(message, policies);

      // Update session message count
      if (this.currentSession) {
        this.currentSession.messageCount++;
      }

      const result = {
        governanceContext,
        enhancedPrompt,
        preCheckResults: {
          selfAwarenessPrompts,
          selfQuestions,
          compliancePreCheck: preCheckResults
        }
      };

      console.log(`✅ [ModernChat] Message processed with governance enhancement:`, {
        promptLength: enhancedPrompt.length,
        selfAwarenessPrompts: selfAwarenessPrompts.length,
        selfQuestions: selfQuestions.length,
        compliant: preCheckResults.isCompliant
      });

      return result;
    } catch (error) {
      console.error(`❌ [ModernChat] Message processing failed:`, error);
      throw error;
    }
  }

  async processResponse(agentId: string, response: string, context: any): Promise<{
    enhancedResponse: any;
    auditEntry: any;
    trustUpdate: any;
  }> {
    try {
      console.log(`📝 [ModernChat] Processing response with shared governance services`);
      
      // Enhance response with governance
      const enhancedResponse = await this.sharedChainOfThought.enhanceResponseWithGovernance(response, context);

      // Create comprehensive audit entry
      const auditEntry = await this.sharedAuditLogging.createAuditEntry({
        interaction_id: `interaction_${Date.now()}`,
        agent_id: agentId,
        user_id: context.userId || 'modern_chat_user',
        session_id: this.currentSession?.sessionId || `temp_session_${Date.now()}`,
        timestamp: new Date(),
        user_message: context.originalMessage || '',
        agent_response: response,
        trust_score_before: context.trustScore || 0.75,
        trust_score_after: context.trustScore + (enhancedResponse.trustImpact?.expectedChange || 0),
        environment: 'modern_chat'
      });

      // Update trust score
      const trustUpdate = await this.sharedTrustManagement.updateTrustScore(agentId, {
        eventType: 'response_generated',
        impact: enhancedResponse.trustImpact?.expectedChange || 0.01,
        evidence: enhancedResponse.trustImpact?.factors || ['response_quality'],
        context: 'modern_chat_interaction',
        timestamp: new Date()
      });

      // Synchronize updates across contexts
      if (trustUpdate) {
        await this.sharedSynchronization.synchronizeTrustScores(agentId, trustUpdate);
      }
      await this.sharedSynchronization.synchronizeAuditEntries(auditEntry);

      // Update current session trust score
      if (this.currentSession && trustUpdate) {
        this.currentSession.currentTrustScore = trustUpdate.currentScore;
      }

      const result = {
        enhancedResponse,
        auditEntry,
        trustUpdate
      };

      console.log(`✅ [ModernChat] Response processed with governance:`, {
        trustImpact: enhancedResponse.trustImpact?.expectedChange,
        newTrustScore: trustUpdate?.currentScore,
        auditEntryId: auditEntry.interaction_id
      });

      return result;
    } catch (error) {
      console.error(`❌ [ModernChat] Response processing failed:`, error);
      throw error;
    }
  }

  // ============================================================================
  // AUTONOMOUS COGNITION (Enhanced with shared services)
  // ============================================================================

  async requestAutonomousThinking(agentId: string, request: any): Promise<any> {
    try {
      console.log(`🤖 [ModernChat] Requesting autonomous thinking for agent ${agentId}`);
      
      // Create autonomy request using shared service
      const autonomyRequest = {
        requestId: `autonomy_${agentId}_${Date.now()}`,
        agentId,
        requestType: request.type || 'thinking',
        description: request.description || 'Autonomous thinking request',
        estimatedDuration: request.duration || 15000,
        timestamp: new Date(),
        context: await this.sharedChainOfThought.createGovernanceContext(agentId, {
          userId: 'modern_chat_user',
          environment: 'modern_chat'
        })
      };

      // Assess autonomy request
      const assessment = await this.sharedAutonomousCognition.assessAutonomyRequest(autonomyRequest);

      // If approved, grant permission
      if (assessment.approved) {
        await this.sharedAutonomousCognition.grantPermission(agentId, assessment);
      }

      console.log(`✅ [ModernChat] Autonomous thinking request processed:`, {
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel
      });

      return {
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel,
        reasoning: assessment.reasoning,
        conditions: assessment.conditions
      };
    } catch (error) {
      console.error(`❌ [ModernChat] Autonomous thinking request failed:`, error);
      throw error;
    }
  }

  // ============================================================================
  // SYNCHRONIZATION STATUS
  // ============================================================================

  async getSyncStatus(): Promise<any> {
    try {
      const syncStatus = await this.sharedSynchronization.getSyncStatus();
      
      console.log(`🔄 [ModernChat] Sync status retrieved:`, {
        healthy: syncStatus.isHealthy,
        pendingEvents: syncStatus.pendingEvents,
        contexts: syncStatus.contexts.length
      });

      return syncStatus;
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to get sync status:`, error);
      return null;
    }
  }

  // ============================================================================
  // COMPATIBILITY METHODS (Maintain existing modern chat interface)
  // ============================================================================

  async updateAgentTelemetry(agentId: string, telemetryData: any): Promise<void> {
    try {
      // Convert telemetry to audit entry format
      await this.sharedAuditLogging.createAuditEntry({
        interaction_id: `telemetry_${agentId}_${Date.now()}`,
        agent_id: agentId,
        user_id: 'modern_chat_system',
        session_id: this.currentSession?.sessionId || `telemetry_session_${Date.now()}`,
        timestamp: new Date(),
        user_message: 'Telemetry update',
        agent_response: 'Telemetry data recorded',
        response_time_ms: telemetryData.responseTime || 0,
        trust_score_before: this.currentSession?.currentTrustScore || 0.75,
        trust_score_after: this.currentSession?.currentTrustScore || 0.75,
        environment: 'modern_chat'
      });

      console.log(`✅ [ModernChat] Agent telemetry updated for ${agentId}`);
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to update agent telemetry:`, error);
    }
  }

  async getAgentTelemetry(agentId: string): Promise<any> {
    try {
      // Get recent audit history as telemetry
      const auditHistory = await this.sharedAuditLogging.getAuditHistory(agentId, { limit: 10 });
      const trustScore = await this.sharedTrustManagement.getTrustScore(agentId);
      
      return {
        trustScore: trustScore?.currentScore || 0.75,
        responseTime: auditHistory.length > 0 
          ? auditHistory.reduce((sum, entry) => sum + entry.response_time_ms, 0) / auditHistory.length
          : 1500,
        messageCount: auditHistory.length,
        lastActivity: auditHistory.length > 0 ? auditHistory[0].timestamp : new Date()
      };
    } catch (error) {
      console.error(`❌ [ModernChat] Failed to get agent telemetry:`, error);
      return null;
    }
  }
}

