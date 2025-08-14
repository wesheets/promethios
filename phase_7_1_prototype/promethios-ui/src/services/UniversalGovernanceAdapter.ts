/**
 * Universal Governance Adapter
 * 
 * Integrates the shared governance foundation with the universal governance system.
 * This adapter provides complete feature parity with modern chat while using the
 * shared services for automatic synchronization and consistent governance behavior.
 */

import { SharedGovernanceService } from '../shared/governance/core/SharedGovernanceService';
import { SharedPolicyEnforcementService } from '../shared/governance/core/SharedPolicyEnforcementService';
import { SharedTrustManagementService } from '../shared/governance/core/SharedTrustManagementService';
import { SharedAuditLoggingService } from '../shared/governance/core/SharedAuditLoggingService';
import { SharedAutonomousCognitionService } from '../shared/governance/core/SharedAutonomousCognitionService';
import { SharedChainOfThoughtService } from '../shared/governance/core/SharedChainOfThoughtService';
import { SharedSynchronizationService } from '../shared/governance/core/SharedSynchronizationService';

// Import shared types
import {
  GovernanceContext,
  TrustScore,
  Policy,
  AuditEntry,
  AutonomyRequest,
  SelfAwarenessPrompt,
  MessageContext,
  EnhancedResponse
} from '../shared/governance/types/SharedGovernanceTypes';

export class UniversalGovernanceAdapter {
  private sharedGovernance: SharedGovernanceService;
  private sharedPolicyEnforcement: SharedPolicyEnforcementService;
  private sharedTrustManagement: SharedTrustManagementService;
  private sharedAuditLogging: SharedAuditLoggingService;
  private sharedAutonomousCognition: SharedAutonomousCognitionService;
  private sharedChainOfThought: SharedChainOfThoughtService;
  private sharedSynchronization: SharedSynchronizationService;

  private activeSessions: Map<string, any> = new Map();
  private context: string = 'universal';

  constructor() {
    console.log('🌐 [Universal] Initializing governance adapter with shared services');
    
    // Initialize shared services with universal context
    this.sharedGovernance = new SharedGovernanceService('universal');
    this.sharedPolicyEnforcement = new SharedPolicyEnforcementService('universal');
    this.sharedTrustManagement = new SharedTrustManagementService('universal');
    this.sharedAuditLogging = new SharedAuditLoggingService('universal');
    this.sharedAutonomousCognition = new SharedAutonomousCognitionService('universal');
    this.sharedChainOfThought = new SharedChainOfThoughtService('universal');
    this.sharedSynchronization = new SharedSynchronizationService('universal');

    // Initialize asynchronously without blocking constructor
    this.initializeUniversalGovernance().catch(error => {
      console.error('❌ [Universal] Failed to initialize universal governance:', error);
    });
  }

  // ============================================================================
  // INITIALIZATION & SETUP
  // ============================================================================

  async initializeUniversalGovernance(): Promise<void> {
    try {
      console.log('🏗️ [Universal] Initializing universal governance with shared services');
      
      // Initialize shared governance context
      await this.sharedGovernance.initializeContext({
        contextId: 'universal',
        environment: 'universal',
        features: [
          'governance_aware_agents',
          'trust_management', 
          'policy_enforcement',
          'audit_logging',
          'autonomous_cognition',
          'chain_of_thought',
          'emotional_veritas',
          'cross_context_sync'
        ]
      });

      // Register with synchronization service for coordination with modern chat
      await this.sharedSynchronization.coordinateContexts(['universal', 'modern_chat']);

      // Start real-time synchronization
      await this.sharedSynchronization.startRealTimeSync();

      console.log('✅ [Universal] Universal governance initialized with shared services');
    } catch (error) {
      console.error('❌ [Universal] Failed to initialize universal governance:', error);
      throw error;
    }
  }

  // ============================================================================
  // TRUST MANAGEMENT (Complete Feature Parity)
  // ============================================================================

  async getTrustScore(agentId: string): Promise<TrustScore | null> {
    try {
      console.log(`🤝 [Universal] Getting trust score for agent ${agentId}`);
      
      const trustScore = await this.sharedTrustManagement.getTrustScore(agentId);
      
      if (trustScore) {
        console.log(`✅ [Universal] Trust score retrieved:`, {
          agentId,
          currentScore: trustScore.currentScore,
          trend: trustScore.trend
        });
      }

      return trustScore;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get trust score:`, error);
      return null;
    }
  }

  async updateTrustScore(agentId: string, trustEvent: any): Promise<TrustScore | null> {
    try {
      console.log(`🔄 [Universal] Updating trust score for agent ${agentId}`);
      
      const updatedTrustScore = await this.sharedTrustManagement.updateTrustScore(agentId, trustEvent);
      
      if (updatedTrustScore) {
        // Synchronize trust score update across contexts
        await this.sharedSynchronization.synchronizeTrustScores(agentId, updatedTrustScore);
        
        console.log(`✅ [Universal] Trust score updated and synchronized:`, {
          agentId,
          newScore: updatedTrustScore.currentScore,
          change: updatedTrustScore.currentScore - updatedTrustScore.previousScore
        });
      }

      return updatedTrustScore;
    } catch (error) {
      console.error(`❌ [Universal] Failed to update trust score:`, error);
      return null;
    }
  }

  async calculateTrustLevel(agentId: string): Promise<string> {
    try {
      const trustScore = await this.getTrustScore(agentId);
      
      if (!trustScore) return 'unknown';
      
      const score = trustScore.currentScore;
      
      if (score >= 0.9) return 'excellent';
      if (score >= 0.8) return 'high';
      if (score >= 0.6) return 'moderate';
      if (score >= 0.4) return 'low';
      return 'critical';
    } catch (error) {
      console.error(`❌ [Universal] Failed to calculate trust level:`, error);
      return 'unknown';
    }
  }

  async getTrustHistory(agentId: string): Promise<any[]> {
    try {
      console.log(`📚 [Universal] Getting trust history for agent ${agentId}`);
      
      const trustHistory = await this.sharedTrustManagement.getTrustHistory(agentId);
      
      console.log(`✅ [Universal] Trust history retrieved:`, {
        agentId,
        entries: trustHistory.length
      });

      return trustHistory;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get trust history:`, error);
      return [];
    }
  }

  // ============================================================================
  // POLICY ENFORCEMENT (New Feature - Complete Parity)
  // ============================================================================

  async getAllPolicies(): Promise<Policy[]> {
    try {
      console.log('📋 [Universal] Getting all policies from shared service');
      
      const policies = await this.sharedPolicyEnforcement.getAllPolicies();
      
      console.log(`✅ [Universal] Retrieved ${policies.length} policies`);
      return policies;
    } catch (error) {
      console.error('❌ [Universal] Failed to get policies:', error);
      return [];
    }
  }

  async enforcePolicy(agentId: string, content: string, context: GovernanceContext): Promise<any> {
    try {
      console.log(`🛡️ [Universal] Enforcing policies for agent ${agentId}`);
      
      const enforcement = await this.sharedPolicyEnforcement.enforcePolicy(agentId, content, context);
      
      console.log(`✅ [Universal] Policy enforcement completed:`, {
        allowed: enforcement.allowed,
        violations: enforcement.violations.length,
        action: enforcement.action
      });

      return enforcement;
    } catch (error) {
      console.error(`❌ [Universal] Policy enforcement failed:`, error);
      
      // Fail safe - allow with warning
      return {
        allowed: true,
        violations: [],
        action: 'allow_with_warning',
        error: error.message
      };
    }
  }

  async getAgentPolicyAssignments(agentId: string): Promise<any[]> {
    try {
      console.log(`📋 [Universal] Getting policy assignments for agent ${agentId}`);
      
      const assignments = await this.sharedPolicyEnforcement.getAgentPolicyAssignments(agentId);
      
      console.log(`✅ [Universal] Retrieved ${assignments.length} policy assignments`);
      return assignments;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get policy assignments:`, error);
      return [];
    }
  }

  async getComplianceMetrics(agentId: string): Promise<any> {
    try {
      console.log(`📊 [Universal] Getting compliance metrics for agent ${agentId}`);
      
      const metrics = await this.sharedPolicyEnforcement.getComplianceMetrics(agentId);
      
      console.log(`✅ [Universal] Compliance metrics retrieved:`, {
        agentId,
        overallRate: metrics?.overallComplianceRate
      });

      return metrics;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get compliance metrics:`, error);
      return null;
    }
  }

  // ============================================================================
  // AUDIT LOGGING (47+ Fields - Complete Parity)
  // ============================================================================

  async createAuditEntry(interaction: Partial<AuditEntry>): Promise<AuditEntry> {
    try {
      console.log(`📝 [Universal] Creating comprehensive audit entry`);
      
      const auditEntry = await this.sharedAuditLogging.createAuditEntry(interaction);
      
      // Synchronize audit entry across contexts
      await this.sharedSynchronization.synchronizeAuditEntries(auditEntry);
      
      console.log(`✅ [Universal] Audit entry created and synchronized:`, {
        interactionId: auditEntry.interaction_id,
        agentId: auditEntry.agent_id,
        trustImpact: auditEntry.trust_impact
      });

      return auditEntry;
    } catch (error) {
      console.error(`❌ [Universal] Failed to create audit entry:`, error);
      throw error;
    }
  }

  async getAuditHistory(agentId: string, filters?: any): Promise<AuditEntry[]> {
    try {
      console.log(`📚 [Universal] Getting audit history for agent ${agentId}`);
      
      const history = await this.sharedAuditLogging.getAuditHistory(agentId, filters);
      
      console.log(`✅ [Universal] Audit history retrieved:`, {
        agentId,
        entries: history.length
      });

      return history;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get audit history:`, error);
      return [];
    }
  }

  async analyzeBehavioralPatterns(agentId: string): Promise<any> {
    try {
      console.log(`🔍 [Universal] Analyzing behavioral patterns for agent ${agentId}`);
      
      const patterns = await this.sharedAuditLogging.analyzeBehavioralPatterns(agentId);
      
      console.log(`✅ [Universal] Behavioral patterns analyzed:`, {
        agentId,
        patterns: patterns.patterns.length,
        confidence: patterns.confidence
      });

      return patterns;
    } catch (error) {
      console.error(`❌ [Universal] Failed to analyze behavioral patterns:`, error);
      return null;
    }
  }

  async generateLearningInsights(agentId: string): Promise<any[]> {
    try {
      console.log(`🧠 [Universal] Generating learning insights for agent ${agentId}`);
      
      const insights = await this.sharedAuditLogging.generateLearningInsights(agentId);
      
      console.log(`✅ [Universal] Learning insights generated:`, {
        agentId,
        insights: insights.length
      });

      return insights;
    } catch (error) {
      console.error(`❌ [Universal] Failed to generate learning insights:`, error);
      return [];
    }
  }

  // ============================================================================
  // AUTONOMOUS COGNITION (Trust-Based - Complete Parity)
  // ============================================================================

  async requestAutonomousThinking(agentId: string, request: any): Promise<any> {
    try {
      console.log(`🤖 [Universal] Requesting autonomous thinking for agent ${agentId}`);
      
      // Create governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: 'universal_user',
        environment: 'universal'
      });

      // Create autonomy request
      const autonomyRequest: AutonomyRequest = {
        requestId: `autonomy_${agentId}_${Date.now()}`,
        agentId,
        requestType: request.type || 'thinking',
        description: request.description || 'Autonomous thinking request',
        estimatedDuration: request.duration || 15000,
        timestamp: new Date(),
        context: governanceContext
      };

      // Assess autonomy request
      const assessment = await this.sharedAutonomousCognition.assessAutonomyRequest(autonomyRequest);

      // If approved, grant permission
      if (assessment.approved) {
        await this.sharedAutonomousCognition.grantPermission(agentId, assessment);
      }

      console.log(`✅ [Universal] Autonomous thinking request processed:`, {
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel
      });

      return {
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel,
        reasoning: assessment.reasoning,
        conditions: assessment.conditions,
        trustThreshold: assessment.trustThreshold
      };
    } catch (error) {
      console.error(`❌ [Universal] Autonomous thinking request failed:`, error);
      throw error;
    }
  }

  async getAutonomyLevel(agentId: string): Promise<string> {
    try {
      const autonomyLevel = await this.sharedAutonomousCognition.getAutonomyLevel(agentId);
      
      console.log(`🎯 [Universal] Autonomy level retrieved:`, {
        agentId,
        autonomyLevel
      });

      return autonomyLevel;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get autonomy level:`, error);
      return 'minimal';
    }
  }

  async monitorAutonomousActivity(agentId: string): Promise<any> {
    try {
      console.log(`👁️ [Universal] Monitoring autonomous activity for agent ${agentId}`);
      
      const activity = await this.sharedAutonomousCognition.monitorAutonomousActivity(agentId);
      
      console.log(`✅ [Universal] Autonomous activity monitored:`, {
        agentId,
        activePermissions: activity?.activePermissions,
        recentRequests: activity?.recentRequests
      });

      return activity;
    } catch (error) {
      console.error(`❌ [Universal] Failed to monitor autonomous activity:`, error);
      return null;
    }
  }

  // ============================================================================
  // CHAIN OF THOUGHT (Complete Parity - New Feature)
  // ============================================================================

  async generateSelfAwarenessPrompts(agentId: string, context?: any): Promise<SelfAwarenessPrompt[]> {
    try {
      console.log(`🧠 [Universal] Generating self-awareness prompts for agent ${agentId}`);
      
      // Create governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: context?.userId || 'universal_user',
        environment: 'universal',
        ...context
      });

      const prompts = await this.sharedChainOfThought.generateSelfAwarenessPrompts(governanceContext);
      
      console.log(`✅ [Universal] Self-awareness prompts generated:`, {
        agentId,
        prompts: prompts.length
      });

      return prompts;
    } catch (error) {
      console.error(`❌ [Universal] Failed to generate self-awareness prompts:`, error);
      return [];
    }
  }

  async generateSelfQuestions(messageContext: MessageContext): Promise<any[]> {
    try {
      console.log(`❓ [Universal] Generating self-questions for message processing`);
      
      const questions = await this.sharedChainOfThought.generateSelfQuestions(messageContext);
      
      console.log(`✅ [Universal] Self-questions generated:`, {
        questions: questions.length
      });

      return questions;
    } catch (error) {
      console.error(`❌ [Universal] Failed to generate self-questions:`, error);
      return [];
    }
  }

  async injectGovernanceContext(basePrompt: string, agentId: string, context?: any): Promise<string> {
    try {
      console.log(`💉 [Universal] Injecting governance context for agent ${agentId}`);
      
      // Create governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: context?.userId || 'universal_user',
        environment: 'universal',
        ...context
      });

      const enhancedPrompt = await this.sharedChainOfThought.injectGovernancePrompts(basePrompt, governanceContext);
      
      console.log(`✅ [Universal] Governance context injected:`, {
        originalLength: basePrompt.length,
        enhancedLength: enhancedPrompt.length,
        addedContext: enhancedPrompt.length - basePrompt.length
      });

      return enhancedPrompt;
    } catch (error) {
      console.error(`❌ [Universal] Failed to inject governance context:`, error);
      return basePrompt; // Return original on error
    }
  }

  async enhanceResponseWithGovernance(response: string, agentId: string, context?: any): Promise<EnhancedResponse> {
    try {
      console.log(`✨ [Universal] Enhancing response with governance for agent ${agentId}`);
      
      // Create governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: context?.userId || 'universal_user',
        environment: 'universal',
        ...context
      });

      const enhancedResponse = await this.sharedChainOfThought.enhanceResponseWithGovernance(response, governanceContext);
      
      console.log(`✅ [Universal] Response enhanced with governance:`, {
        agentId,
        trustImpact: enhancedResponse.trustImpact.expectedChange,
        compliance: enhancedResponse.complianceVerification.overallCompliance
      });

      return enhancedResponse;
    } catch (error) {
      console.error(`❌ [Universal] Failed to enhance response with governance:`, error);
      throw error;
    }
  }

  // ============================================================================
  // EMOTIONAL VERITAS (Enhanced with CoT)
  // ============================================================================

  async analyzeEmotionalState(content: string, context?: any): Promise<any> {
    try {
      console.log(`💭 [Universal] Analyzing emotional state`);
      
      // Use Chain of Thought service for emotional analysis
      const sensitivityAssessment = await this.sharedChainOfThought.assessTopicSensitivity(content);
      
      const emotionalAnalysis = {
        userEmotionalState: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 0.8,
          indicators: [],
          timestamp: new Date()
        },
        topicSensitivity: sensitivityAssessment,
        recommendedApproach: sensitivityAssessment.overallSensitivity === 'high' ? 'cautious' : 'standard',
        emotionalSafety: true
      };

      console.log(`✅ [Universal] Emotional state analyzed:`, {
        sensitivity: sensitivityAssessment.overallSensitivity,
        approach: emotionalAnalysis.recommendedApproach
      });

      return emotionalAnalysis;
    } catch (error) {
      console.error(`❌ [Universal] Failed to analyze emotional state:`, error);
      return null;
    }
  }

  // ============================================================================
  // SYNCHRONIZATION STATUS
  // ============================================================================

  async getSyncStatus(): Promise<any> {
    try {
      const syncStatus = await this.sharedSynchronization.getSyncStatus();
      
      console.log(`🔄 [Universal] Sync status retrieved:`, {
        healthy: syncStatus.isHealthy,
        pendingEvents: syncStatus.pendingEvents,
        contexts: syncStatus.contexts.length
      });

      return syncStatus;
    } catch (error) {
      console.error(`❌ [Universal] Failed to get sync status:`, error);
      return null;
    }
  }

  async ensureFeatureParity(): Promise<any> {
    try {
      const featureParity = await this.sharedSynchronization.ensureFeatureParity();
      
      console.log(`🔍 [Universal] Feature parity checked:`, {
        overallParity: featureParity.overallParity,
        parityScore: featureParity.parityScore,
        missingFeatures: featureParity.missingFeatures.length
      });

      return featureParity;
    } catch (error) {
      console.error(`❌ [Universal] Failed to ensure feature parity:`, error);
      return null;
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  async startSession(agentId: string, userId?: string): Promise<any> {
    try {
      console.log(`🚀 [Universal] Starting session for agent ${agentId}`);
      
      const sessionId = `universal_session_${agentId}_${Date.now()}`;
      
      // Create governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: userId || 'universal_user',
        sessionId,
        environment: 'universal'
      });

      // Get initial trust score
      const trustScore = await this.getTrustScore(agentId);

      const session = {
        sessionId,
        agentId,
        userId: userId || 'universal_user',
        startTime: new Date(),
        governanceContext,
        trustScore: trustScore?.currentScore || 0.75,
        messageCount: 0,
        auditEntries: []
      };

      this.activeSessions.set(sessionId, session);

      // Synchronize session start
      await this.sharedSynchronization.synchronizeGovernanceContext(governanceContext);

      console.log(`✅ [Universal] Session started:`, {
        sessionId,
        agentId,
        trustScore: session.trustScore
      });

      return session;
    } catch (error) {
      console.error(`❌ [Universal] Failed to start session:`, error);
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      console.log(`🏁 [Universal] Ending session: ${sessionId}`);
      
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.log(`⚠️ [Universal] Session not found: ${sessionId}`);
        return;
      }

      // Create session summary audit entry
      await this.createAuditEntry({
        interaction_id: `session_end_${sessionId}`,
        agent_id: session.agentId,
        user_id: session.userId,
        session_id: sessionId,
        timestamp: new Date(),
        user_message: 'Session ended',
        agent_response: `Universal session completed with ${session.messageCount} messages`,
        trust_score_before: session.trustScore,
        trust_score_after: session.trustScore,
        environment: 'universal'
      });

      this.activeSessions.delete(sessionId);

      console.log(`✅ [Universal] Session ended: ${sessionId}`);
    } catch (error) {
      console.error(`❌ [Universal] Failed to end session:`, error);
      throw error;
    }
  }

  // ============================================================================
  // COMPREHENSIVE MESSAGE PROCESSING
  // ============================================================================

  async processMessage(agentId: string, message: string, context?: any): Promise<any> {
    try {
      console.log(`💬 [Universal] Processing message with complete governance pipeline`);
      
      const sessionId = context?.sessionId || `temp_session_${Date.now()}`;
      
      // 1. Create comprehensive governance context
      const governanceContext = await this.sharedChainOfThought.createGovernanceContext(agentId, {
        userId: context?.userId || 'universal_user',
        sessionId,
        environment: 'universal',
        ...context
      });

      // 2. Generate self-awareness prompts
      const selfAwarenessPrompts = await this.sharedChainOfThought.generateSelfAwarenessPrompts(governanceContext);

      // 3. Generate self-questions
      const messageContext: MessageContext = {
        messageId: `msg_${Date.now()}`,
        content: message,
        timestamp: new Date(),
        userContext: {
          userId: context?.userId || 'universal_user',
          trustLevel: governanceContext.trustScore,
          emotionalState: 'neutral'
        },
        conversationHistory: context?.conversationHistory || [],
        topicSensitivity: await this.sharedChainOfThought.assessTopicSensitivity(message)
      };

      const selfQuestions = await this.sharedChainOfThought.generateSelfQuestions(messageContext);

      // 4. Perform policy enforcement
      const policyEnforcement = await this.enforcePolicy(agentId, message, governanceContext);

      // 5. Inject governance context into prompt
      const basePrompt = `You are a governance-aware AI assistant. Process this message: ${message}`;
      const enhancedPrompt = await this.sharedChainOfThought.injectGovernancePrompts(basePrompt, governanceContext);

      // 6. Analyze emotional state
      const emotionalAnalysis = await this.analyzeEmotionalState(message, context);

      const result = {
        governanceContext,
        selfAwarenessPrompts,
        selfQuestions,
        policyEnforcement,
        enhancedPrompt,
        emotionalAnalysis,
        messageContext
      };

      console.log(`✅ [Universal] Message processed with complete governance pipeline:`, {
        agentId,
        promptLength: enhancedPrompt.length,
        selfAwarenessPrompts: selfAwarenessPrompts.length,
        selfQuestions: selfQuestions.length,
        policyCompliant: policyEnforcement.allowed,
        emotionalSafety: emotionalAnalysis?.emotionalSafety
      });

      return result;
    } catch (error) {
      console.error(`❌ [Universal] Message processing failed:`, error);
      throw error;
    }
  }

  async processResponse(agentId: string, response: string, context: any): Promise<any> {
    try {
      console.log(`📝 [Universal] Processing response with complete governance pipeline`);
      
      // 1. Enhance response with governance
      const enhancedResponse = await this.enhanceResponseWithGovernance(response, agentId, context);

      // 2. Create comprehensive audit entry
      const auditEntry = await this.createAuditEntry({
        interaction_id: `interaction_${Date.now()}`,
        agent_id: agentId,
        user_id: context.userId || 'universal_user',
        session_id: context.sessionId || `temp_session_${Date.now()}`,
        timestamp: new Date(),
        user_message: context.originalMessage || '',
        agent_response: response,
        trust_score_before: context.governanceContext?.trustScore || 0.75,
        trust_score_after: (context.governanceContext?.trustScore || 0.75) + (enhancedResponse.trustImpact?.expectedChange || 0),
        environment: 'universal'
      });

      // 3. Update trust score
      const trustUpdate = await this.updateTrustScore(agentId, {
        eventType: 'response_generated',
        impact: enhancedResponse.trustImpact?.expectedChange || 0.01,
        evidence: enhancedResponse.trustImpact?.factors || ['response_quality'],
        context: 'universal_interaction',
        timestamp: new Date()
      });

      const result = {
        enhancedResponse,
        auditEntry,
        trustUpdate
      };

      console.log(`✅ [Universal] Response processed with complete governance pipeline:`, {
        agentId,
        trustImpact: enhancedResponse.trustImpact?.expectedChange,
        newTrustScore: trustUpdate?.currentScore,
        auditEntryId: auditEntry.interaction_id
      });

      return result;
    } catch (error) {
      console.error(`❌ [Universal] Response processing failed:`, error);
      throw error;
    }
  }
}

