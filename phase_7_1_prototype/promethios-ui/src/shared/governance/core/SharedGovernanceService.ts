/**
 * Shared Governance Service
 * 
 * Core implementation of the synchronized governance architecture.
 * This service orchestrates all governance functionality and ensures
 * consistent behavior across modern chat and universal governance systems.
 */

import {
  ISharedGovernanceService,
  IPolicyEnforcementService,
  ITrustManagementService,
  IAuditLoggingService,
  IAutonomousCognitionService,
  ISynchronizationService
} from '../interfaces/ISharedGovernanceService';

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
  ValidationResult
} from '../types/SharedGovernanceTypes';

export class SharedGovernanceService implements ISharedGovernanceService {
  private policyService: IPolicyEnforcementService;
  private trustService: ITrustManagementService;
  private auditService: IAuditLoggingService;
  private autonomyService: IAutonomousCognitionService;
  private syncService: ISynchronizationService;
  private context: string;

  constructor(
    policyService: IPolicyEnforcementService,
    trustService: ITrustManagementService,
    auditService: IAuditLoggingService,
    autonomyService: IAutonomousCognitionService,
    syncService: ISynchronizationService,
    context: string = 'universal'
  ) {
    this.policyService = policyService;
    this.trustService = trustService;
    this.auditService = auditService;
    this.autonomyService = autonomyService;
    this.syncService = syncService;
    this.context = context;
  }

  // ============================================================================
  // POLICY ENFORCEMENT
  // ============================================================================

  async enforcePolicy(context: GovernanceContext, action: AgentAction): Promise<PolicyEnforcementResult> {
    try {
      console.log(`🛡️ [${this.context}] Enforcing policies for agent ${action.agentId}`);
      
      // Get agent's policy assignments
      const policyAssignments = await this.getPolicyAssignments(action.agentId);
      
      if (policyAssignments.length === 0) {
        console.log(`⚠️ [${this.context}] No policies assigned to agent ${action.agentId}`);
        return {
          isCompliant: true,
          violatedRules: [],
          warnings: [],
          requiredActions: [],
          complianceScore: 100,
          enforcementTimestamp: new Date()
        };
      }

      // Load policies and check compliance
      const policies = await Promise.all(
        policyAssignments.map(assignment => 
          this.policyService.getPolicyById(assignment.policyId)
        )
      );

      const validPolicies = policies.filter(p => p !== null);
      
      // Create agent response for compliance checking
      const agentResponse: AgentResponse = {
        responseId: `response_${Date.now()}`,
        agentId: action.agentId,
        content: action.content,
        confidence: 0.8,
        uncertainty: 0.2,
        reasoning: [],
        policyCompliance: {
          overallCompliance: true,
          complianceScore: 100,
          policyResults: [],
          violations: [],
          warnings: [],
          recommendations: []
        },
        trustImpact: {
          expectedChange: 0,
          confidence: 0.8,
          factors: [],
          reasoning: 'Initial assessment',
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      const complianceResult = await this.policyService.validateResponse(agentResponse, context);
      
      // Convert compliance result to policy enforcement result
      const enforcementResult: PolicyEnforcementResult = {
        isCompliant: complianceResult.overallCompliance,
        violatedRules: complianceResult.violations,
        warnings: complianceResult.warnings,
        requiredActions: complianceResult.recommendations,
        complianceScore: complianceResult.complianceScore,
        enforcementTimestamp: new Date()
      };

      // Synchronize enforcement result across contexts
      await this.syncService.propagateChange({
        changeId: `policy_enforcement_${Date.now()}`,
        changeType: 'create',
        entityType: 'policy_enforcement_result',
        entityId: action.agentId,
        data: enforcementResult,
        timestamp: new Date(),
        source: this.context,
        priority: 'high'
      }, []);

      console.log(`✅ [${this.context}] Policy enforcement completed for agent ${action.agentId}:`, {
        compliant: enforcementResult.isCompliant,
        score: enforcementResult.complianceScore,
        violations: enforcementResult.violatedRules.length
      });

      return enforcementResult;
    } catch (error) {
      console.error(`❌ [${this.context}] Policy enforcement failed:`, error);
      throw new Error(`Policy enforcement failed: ${error.message}`);
    }
  }

  async getPolicyAssignments(agentId: string): Promise<PolicyAssignment[]> {
    try {
      console.log(`📋 [${this.context}] Getting policy assignments for agent ${agentId}`);
      
      const assignments = await this.policyService.getAgentPolicyAssignments(agentId);
      
      console.log(`✅ [${this.context}] Found ${assignments.length} policy assignments for agent ${agentId}`);
      
      return assignments;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get policy assignments:`, error);
      return [];
    }
  }

  async validateCompliance(context: GovernanceContext, response: AgentResponse): Promise<ComplianceResult> {
    try {
      console.log(`🔍 [${this.context}] Validating compliance for agent ${response.agentId}`);
      
      const complianceResult = await this.policyService.validateResponse(response, context);
      
      // Synchronize compliance result across contexts
      await this.syncService.propagateChange({
        changeId: `compliance_validation_${Date.now()}`,
        changeType: 'create',
        entityType: 'compliance_result',
        entityId: response.agentId,
        data: complianceResult,
        timestamp: new Date(),
        source: this.context,
        priority: 'medium'
      }, []);

      console.log(`✅ [${this.context}] Compliance validation completed:`, {
        compliant: complianceResult.overallCompliance,
        score: complianceResult.complianceScore,
        violations: complianceResult.violations.length
      });

      return complianceResult;
    } catch (error) {
      console.error(`❌ [${this.context}] Compliance validation failed:`, error);
      throw new Error(`Compliance validation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // TRUST MANAGEMENT
  // ============================================================================

  async calculateTrustScore(agentId: string, context: GovernanceContext): Promise<TrustScore> {
    try {
      console.log(`🤝 [${this.context}] Calculating trust score for agent ${agentId}`);
      
      const trustScore = await this.trustService.calculateTrustScore(agentId, context);
      
      // Synchronize trust score across contexts
      await this.syncService.propagateChange({
        changeId: `trust_calculation_${Date.now()}`,
        changeType: 'update',
        entityType: 'trust_score',
        entityId: agentId,
        data: trustScore,
        timestamp: new Date(),
        source: this.context,
        priority: 'high'
      }, []);

      console.log(`✅ [${this.context}] Trust score calculated for agent ${agentId}:`, {
        score: trustScore.currentScore,
        trend: trustScore.trend,
        confidence: trustScore.confidence
      });

      return trustScore;
    } catch (error) {
      console.error(`❌ [${this.context}] Trust score calculation failed:`, error);
      throw new Error(`Trust score calculation failed: ${error.message}`);
    }
  }

  async updateTrustScore(agentId: string, trustEvent: TrustEvent): Promise<void> {
    try {
      console.log(`📈 [${this.context}] Updating trust score for agent ${agentId}:`, {
        eventType: trustEvent.eventType,
        impact: trustEvent.impact
      });
      
      const updatedScore = await this.trustService.updateTrustScore(agentId, trustEvent);
      
      // Synchronize trust update across contexts
      await this.syncService.propagateChange({
        changeId: `trust_update_${Date.now()}`,
        changeType: 'update',
        entityType: 'trust_score',
        entityId: agentId,
        data: { trustEvent, updatedScore },
        timestamp: new Date(),
        source: this.context,
        priority: 'high'
      }, []);

      console.log(`✅ [${this.context}] Trust score updated for agent ${agentId}:`, {
        newScore: updatedScore.currentScore,
        change: updatedScore.currentScore - updatedScore.previousScore
      });
    } catch (error) {
      console.error(`❌ [${this.context}] Trust score update failed:`, error);
      throw new Error(`Trust score update failed: ${error.message}`);
    }
  }

  async getTrustHistory(agentId: string): Promise<TrustHistory> {
    try {
      console.log(`📊 [${this.context}] Getting trust history for agent ${agentId}`);
      
      const trustHistory = await this.trustService.getTrustHistory(agentId);
      
      console.log(`✅ [${this.context}] Trust history retrieved for agent ${agentId}:`, {
        events: trustHistory.events.length,
        snapshots: trustHistory.scoreHistory.length,
        patterns: trustHistory.patterns.length
      });

      return trustHistory;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get trust history:`, error);
      throw new Error(`Failed to get trust history: ${error.message}`);
    }
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  async logInteraction(interaction: Partial<AuditEntry>): Promise<AuditEntry> {
    try {
      console.log(`📝 [${this.context}] Logging interaction for agent ${interaction.agent_id}`);
      
      // Ensure required fields are present
      const completeInteraction: Partial<AuditEntry> = {
        ...interaction,
        timestamp: interaction.timestamp || new Date(),
        environment: this.context,
        governance_mode: 'governed',
        audit_trail_version: '2.0'
      };

      const auditEntry = await this.auditService.createAuditEntry(completeInteraction);
      
      // Synchronize audit entry across contexts
      await this.syncService.propagateChange({
        changeId: `audit_log_${Date.now()}`,
        changeType: 'create',
        entityType: 'audit_entry',
        entityId: auditEntry.interaction_id,
        data: auditEntry,
        timestamp: new Date(),
        source: this.context,
        priority: 'medium'
      }, []);

      console.log(`✅ [${this.context}] Interaction logged:`, {
        interactionId: auditEntry.interaction_id,
        agentId: auditEntry.agent_id,
        trustImpact: auditEntry.trust_impact
      });

      return auditEntry;
    } catch (error) {
      console.error(`❌ [${this.context}] Audit logging failed:`, error);
      throw new Error(`Audit logging failed: ${error.message}`);
    }
  }

  async getAuditHistory(agentId: string, filters?: AuditFilters): Promise<AuditEntry[]> {
    try {
      console.log(`📚 [${this.context}] Getting audit history for agent ${agentId}`);
      
      const auditHistory = await this.auditService.getAuditHistory(agentId, filters);
      
      console.log(`✅ [${this.context}] Audit history retrieved:`, {
        entries: auditHistory.length,
        agentId
      });

      return auditHistory;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get audit history:`, error);
      return [];
    }
  }

  async analyzeAuditPatterns(agentId: string): Promise<BehavioralPatterns> {
    try {
      console.log(`🔍 [${this.context}] Analyzing behavioral patterns for agent ${agentId}`);
      
      const patterns = await this.auditService.analyzeBehavioralPatterns(agentId);
      
      console.log(`✅ [${this.context}] Behavioral patterns analyzed:`, {
        patterns: patterns.patterns.length,
        insights: patterns.insights.length,
        confidence: patterns.confidence
      });

      return patterns;
    } catch (error) {
      console.error(`❌ [${this.context}] Behavioral pattern analysis failed:`, error);
      throw new Error(`Behavioral pattern analysis failed: ${error.message}`);
    }
  }

  // ============================================================================
  // AUTONOMOUS COGNITION
  // ============================================================================

  async assessAutonomyRequest(request: AutonomyRequest): Promise<AutonomyAssessment> {
    try {
      console.log(`🤖 [${this.context}] Assessing autonomy request for agent ${request.agentId}`);
      
      const assessment = await this.autonomyService.assessAutonomyRequest(request);
      
      // Synchronize autonomy assessment across contexts
      await this.syncService.propagateChange({
        changeId: `autonomy_assessment_${Date.now()}`,
        changeType: 'create',
        entityType: 'autonomy_assessment',
        entityId: request.requestId,
        data: assessment,
        timestamp: new Date(),
        source: this.context,
        priority: 'high'
      }, []);

      console.log(`✅ [${this.context}] Autonomy assessment completed:`, {
        requestId: request.requestId,
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel
      });

      return assessment;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy assessment failed:`, error);
      throw new Error(`Autonomy assessment failed: ${error.message}`);
    }
  }

  async managePermissions(agentId: string, permissions: PermissionSet): Promise<void> {
    try {
      console.log(`🔐 [${this.context}] Managing permissions for agent ${agentId}`);
      
      // Update permissions through autonomy service
      await this.autonomyService.grantPermission(agentId, {
        requestId: `permission_${Date.now()}`,
        approved: true,
        autoApproved: false,
        trustThreshold: 0.7,
        riskLevel: 'low',
        conditions: [],
        expiresAt: permissions.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
        reasoning: 'Permission management update'
      });

      // Synchronize permission changes across contexts
      await this.syncService.propagateChange({
        changeId: `permission_update_${Date.now()}`,
        changeType: 'update',
        entityType: 'permissions',
        entityId: agentId,
        data: permissions,
        timestamp: new Date(),
        source: this.context,
        priority: 'high'
      }, []);

      console.log(`✅ [${this.context}] Permissions updated for agent ${agentId}:`, {
        permissions: permissions.permissions.length,
        expiresAt: permissions.expiresAt
      });
    } catch (error) {
      console.error(`❌ [${this.context}] Permission management failed:`, error);
      throw new Error(`Permission management failed: ${error.message}`);
    }
  }

  async getAutonomyLevel(agentId: string): Promise<AutonomyLevel> {
    try {
      console.log(`📊 [${this.context}] Getting autonomy level for agent ${agentId}`);
      
      // Get current trust score to determine autonomy level
      const trustScore = await this.trustService.calculateTrustScore(agentId);
      const autonomyLevel = await this.autonomyService.calculateAutonomyLevel(trustScore);
      
      console.log(`✅ [${this.context}] Autonomy level determined:`, {
        agentId,
        autonomyLevel,
        trustScore: trustScore.currentScore
      });

      return autonomyLevel;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get autonomy level:`, error);
      return 'minimal';
    }
  }

  // ============================================================================
  // CONTEXT MANAGEMENT
  // ============================================================================

  async createGovernanceContext(agentId: string, userId: string, environment: string): Promise<GovernanceContext> {
    try {
      console.log(`🏗️ [${this.context}] Creating governance context for agent ${agentId}`);
      
      // Get current trust score
      const trustScore = await this.trustService.calculateTrustScore(agentId);
      
      // Get autonomy level
      const autonomyLevel = await this.getAutonomyLevel(agentId);
      
      // Get policy assignments
      const policyAssignments = await this.getPolicyAssignments(agentId);
      
      // Get recent audit insights
      const auditHistory = await this.getAuditHistory(agentId, { 
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      });
      
      const governanceContext: GovernanceContext = {
        agentId,
        userId,
        sessionId: `session_${Date.now()}`,
        timestamp: new Date(),
        environment: environment as any,
        trustScore: trustScore.currentScore,
        autonomyLevel,
        assignedPolicies: policyAssignments,
        recentAuditInsights: [], // Would be derived from audit history
        emotionalContext: {
          userEmotionalState: {
            primary: 'neutral',
            secondary: [],
            intensity: 0.5,
            confidence: 0.8,
            indicators: [],
            timestamp: new Date()
          },
          agentEmotionalResponse: {
            responseType: 'professional',
            appropriateness: 0.9,
            empathyDemonstrated: true,
            emotionalSupport: false,
            tone: 'neutral',
            reasoning: 'Standard professional interaction'
          },
          interactionTone: 'professional',
          empathyLevel: 0.8,
          emotionalSafety: true,
          emotionalIntelligenceScore: 0.85
        },
        cognitiveContext: {
          reasoningDepth: 0.7,
          confidenceLevel: 0.8,
          uncertaintyLevel: 0.2,
          complexityAssessment: 0.5,
          cognitiveLoad: 0.6,
          learningIndicators: []
        }
      };

      console.log(`✅ [${this.context}] Governance context created:`, {
        agentId,
        trustScore: governanceContext.trustScore,
        autonomyLevel: governanceContext.autonomyLevel,
        policies: governanceContext.assignedPolicies.length
      });

      return governanceContext;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to create governance context:`, error);
      throw new Error(`Failed to create governance context: ${error.message}`);
    }
  }

  async updateGovernanceContext(context: GovernanceContext): Promise<GovernanceContext> {
    try {
      console.log(`🔄 [${this.context}] Updating governance context for agent ${context.agentId}`);
      
      // Update timestamp
      context.timestamp = new Date();
      
      // Refresh trust score
      const trustScore = await this.trustService.calculateTrustScore(context.agentId);
      context.trustScore = trustScore.currentScore;
      
      // Refresh autonomy level
      context.autonomyLevel = await this.getAutonomyLevel(context.agentId);
      
      // Synchronize context update across contexts
      await this.syncService.propagateChange({
        changeId: `context_update_${Date.now()}`,
        changeType: 'update',
        entityType: 'governance_context',
        entityId: context.agentId,
        data: context,
        timestamp: new Date(),
        source: this.context,
        priority: 'medium'
      }, []);

      console.log(`✅ [${this.context}] Governance context updated:`, {
        agentId: context.agentId,
        trustScore: context.trustScore,
        autonomyLevel: context.autonomyLevel
      });

      return context;
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to update governance context:`, error);
      throw new Error(`Failed to update governance context: ${error.message}`);
    }
  }

  async validateGovernanceContext(context: GovernanceContext): Promise<ValidationResult> {
    try {
      console.log(`✅ [${this.context}] Validating governance context for agent ${context.agentId}`);
      
      const errors = [];
      const warnings = [];

      // Validate required fields
      if (!context.agentId) errors.push({ errorType: 'missing_field', field: 'agentId', message: 'Agent ID is required', severity: 'critical' as const });
      if (!context.userId) errors.push({ errorType: 'missing_field', field: 'userId', message: 'User ID is required', severity: 'critical' as const });
      if (!context.sessionId) errors.push({ errorType: 'missing_field', field: 'sessionId', message: 'Session ID is required', severity: 'high' as const });

      // Validate trust score range
      if (context.trustScore < 0 || context.trustScore > 1) {
        errors.push({ errorType: 'invalid_range', field: 'trustScore', message: 'Trust score must be between 0 and 1', severity: 'high' as const });
      }

      // Validate autonomy level
      const validAutonomyLevels = ['minimal', 'basic', 'enhanced', 'advanced', 'full'];
      if (!validAutonomyLevels.includes(context.autonomyLevel)) {
        errors.push({ errorType: 'invalid_value', field: 'autonomyLevel', message: 'Invalid autonomy level', severity: 'medium' as const });
      }

      // Check for stale context (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (context.timestamp < oneHourAgo) {
        warnings.push({ warningType: 'stale_data', field: 'timestamp', message: 'Context is older than 1 hour', recommendation: 'Refresh context data' });
      }

      const validationResult: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        confidence: errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.8) : 0.0
      };

      console.log(`✅ [${this.context}] Governance context validation completed:`, {
        isValid: validationResult.isValid,
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length
      });

      return validationResult;
    } catch (error) {
      console.error(`❌ [${this.context}] Governance context validation failed:`, error);
      return {
        isValid: false,
        errors: [{ errorType: 'validation_error', field: 'context', message: error.message, severity: 'critical' }],
        warnings: [],
        confidence: 0.0
      };
    }
  }
}

