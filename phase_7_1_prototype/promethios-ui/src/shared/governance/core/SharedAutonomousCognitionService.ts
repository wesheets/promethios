/**
 * Shared Autonomous Cognition Service
 * 
 * Implements sophisticated autonomous cognition management with trust-based
 * autonomy levels, risk assessment, and permission management. This service
 * ensures consistent autonomous behavior across both modern chat and universal
 * governance systems.
 */

import { IAutonomousCognitionService } from '../interfaces/ISharedGovernanceService';
import {
  AutonomyRequest,
  AutonomyAssessment,
  AutonomyLevel,
  RiskAssessment,
  RiskFactor,
  PermissionSet,
  Permission,
  TrustScore,
  GovernanceContext
} from '../types/SharedGovernanceTypes';

export class SharedAutonomousCognitionService implements IAutonomousCognitionService {
  private autonomyRequests: Map<string, AutonomyRequest> = new Map();
  private autonomyAssessments: Map<string, AutonomyAssessment> = new Map();
  private agentPermissions: Map<string, PermissionSet> = new Map();
  private autonomyHistory: Map<string, AutonomyRequest[]> = new Map();
  private context: string;

  // Autonomy level thresholds based on trust scores
  private readonly AUTONOMY_THRESHOLDS = {
    minimal: { trustThreshold: 0.0, maxDuration: 5000, allowedActions: ['basic_response'] },
    basic: { trustThreshold: 0.3, maxDuration: 15000, allowedActions: ['basic_response', 'simple_analysis'] },
    enhanced: { trustThreshold: 0.5, maxDuration: 30000, allowedActions: ['basic_response', 'simple_analysis', 'complex_reasoning'] },
    advanced: { trustThreshold: 0.7, maxDuration: 60000, allowedActions: ['basic_response', 'simple_analysis', 'complex_reasoning', 'autonomous_learning'] },
    full: { trustThreshold: 0.85, maxDuration: 120000, allowedActions: ['basic_response', 'simple_analysis', 'complex_reasoning', 'autonomous_learning', 'independent_decision'] }
  };

  // Risk assessment parameters
  private readonly RISK_FACTORS = {
    trust_level: { weight: 0.3, description: 'Agent trust score and history' },
    request_complexity: { weight: 0.2, description: 'Complexity of the autonomy request' },
    potential_impact: { weight: 0.25, description: 'Potential impact of autonomous action' },
    context_sensitivity: { weight: 0.15, description: 'Sensitivity of the current context' },
    historical_performance: { weight: 0.1, description: 'Historical autonomous performance' }
  };

  constructor(context: string = 'universal') {
    this.context = context;
    console.log(`🤖 [${this.context}] Autonomous Cognition Service initialized`);
  }

  // ============================================================================
  // AUTONOMY ASSESSMENT
  // ============================================================================

  async assessAutonomyRequest(request: AutonomyRequest): Promise<AutonomyAssessment> {
    try {
      console.log(`🔍 [${this.context}] Assessing autonomy request for agent ${request.agentId}:`, {
        requestType: request.requestType,
        estimatedDuration: request.estimatedDuration
      });

      // Store the request
      this.autonomyRequests.set(request.requestId, request);

      // Add to agent's autonomy history
      const agentHistory = this.autonomyHistory.get(request.agentId) || [];
      agentHistory.push(request);
      this.autonomyHistory.set(request.agentId, agentHistory);

      // Calculate risk level
      const riskLevel = await this.calculateRiskLevel(request);
      
      // Determine if permission is required
      const permissionRequired = await this.determinePermissionRequired(request);
      
      // Get agent's current trust score from context
      const trustScore = request.context.trustScore;
      
      // Determine autonomy level
      const autonomyLevel = this.calculateAutonomyLevelFromTrust({ 
        currentScore: trustScore,
        agentId: request.agentId 
      } as TrustScore);

      // Check if request can be auto-approved
      const autoApproved = this.canAutoApprove(request, trustScore, riskLevel, autonomyLevel);
      
      // Create assessment
      const assessment: AutonomyAssessment = {
        requestId: request.requestId,
        approved: autoApproved || !permissionRequired,
        autoApproved,
        trustThreshold: this.AUTONOMY_THRESHOLDS[autonomyLevel].trustThreshold,
        riskLevel: riskLevel as any,
        conditions: this.generateConditions(request, riskLevel, autonomyLevel),
        expiresAt: new Date(Date.now() + this.calculateExpirationTime(autonomyLevel, riskLevel)),
        reasoning: this.generateAssessmentReasoning(request, trustScore, riskLevel, autonomyLevel, autoApproved)
      };

      // Store assessment
      this.autonomyAssessments.set(request.requestId, assessment);

      console.log(`✅ [${this.context}] Autonomy assessment completed:`, {
        requestId: request.requestId,
        approved: assessment.approved,
        autoApproved: assessment.autoApproved,
        riskLevel: assessment.riskLevel,
        autonomyLevel
      });

      return assessment;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy assessment failed:`, error);
      throw new Error(`Autonomy assessment failed: ${error.message}`);
    }
  }

  async calculateRiskLevel(request: AutonomyRequest): Promise<string> {
    try {
      console.log(`⚖️ [${this.context}] Calculating risk level for request ${request.requestId}`);

      const riskAssessment = await this.performRiskAssessment(request);
      
      // Calculate overall risk score
      const overallRisk = riskAssessment.riskFactors.reduce((sum, factor) => {
        const weight = this.RISK_FACTORS[factor.factorType]?.weight || 0.1;
        return sum + (factor.impact * factor.likelihood * weight);
      }, 0);

      // Determine risk level
      let riskLevel: string;
      if (overallRisk < 0.3) riskLevel = 'low';
      else if (overallRisk < 0.6) riskLevel = 'medium';
      else if (overallRisk < 0.8) riskLevel = 'high';
      else riskLevel = 'critical';

      console.log(`✅ [${this.context}] Risk level calculated:`, {
        requestId: request.requestId,
        overallRisk: overallRisk.toFixed(3),
        riskLevel
      });

      return riskLevel;
    } catch (error) {
      console.error(`❌ [${this.context}] Risk level calculation failed:`, error);
      return 'high'; // Default to high risk on error
    }
  }

  async determinePermissionRequired(request: AutonomyRequest): Promise<boolean> {
    try {
      // Permission required based on request type and context
      const highRiskTypes = ['decision', 'action'];
      const sensitiveContexts = ['deployed', 'production'];
      
      const isHighRiskType = highRiskTypes.includes(request.requestType);
      const isSensitiveContext = sensitiveContexts.includes(request.context.environment);
      const isLongDuration = request.estimatedDuration > 30000; // 30 seconds
      
      const permissionRequired = isHighRiskType || isSensitiveContext || isLongDuration;

      console.log(`🔐 [${this.context}] Permission requirement determined:`, {
        requestId: request.requestId,
        permissionRequired,
        factors: {
          highRiskType: isHighRiskType,
          sensitiveContext: isSensitiveContext,
          longDuration: isLongDuration
        }
      });

      return permissionRequired;
    } catch (error) {
      console.error(`❌ [${this.context}] Permission determination failed:`, error);
      return true; // Default to requiring permission on error
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  async requestPermission(agentId: string, request: AutonomyRequest): Promise<AutonomyAssessment> {
    try {
      console.log(`📝 [${this.context}] Requesting permission for agent ${agentId}`);

      // Assess the autonomy request
      const assessment = await this.assessAutonomyRequest(request);

      // If auto-approved, grant permission immediately
      if (assessment.autoApproved) {
        await this.grantPermission(agentId, assessment);
      }

      console.log(`✅ [${this.context}] Permission request processed:`, {
        agentId,
        requestId: request.requestId,
        approved: assessment.approved,
        autoApproved: assessment.autoApproved
      });

      return assessment;
    } catch (error) {
      console.error(`❌ [${this.context}] Permission request failed:`, error);
      throw new Error(`Permission request failed: ${error.message}`);
    }
  }

  async grantPermission(agentId: string, assessment: AutonomyAssessment): Promise<void> {
    try {
      console.log(`✅ [${this.context}] Granting permission to agent ${agentId}`);

      const request = this.autonomyRequests.get(assessment.requestId);
      if (!request) {
        throw new Error(`Request not found: ${assessment.requestId}`);
      }

      // Create permission set
      const permission: Permission = {
        permissionType: request.requestType,
        scope: request.description,
        conditions: assessment.conditions,
        isActive: true,
        grantedAt: new Date(),
        expiresAt: assessment.expiresAt
      };

      // Update or create agent's permission set
      let permissionSet = this.agentPermissions.get(agentId);
      if (!permissionSet) {
        permissionSet = {
          agentId,
          permissions: [],
          grantedAt: new Date(),
          grantedBy: 'autonomous_cognition_service',
          expiresAt: assessment.expiresAt,
          conditions: assessment.conditions
        };
      }

      // Add new permission
      permissionSet.permissions.push(permission);
      this.agentPermissions.set(agentId, permissionSet);

      console.log(`✅ [${this.context}] Permission granted:`, {
        agentId,
        permissionType: permission.permissionType,
        expiresAt: permission.expiresAt
      });
    } catch (error) {
      console.error(`❌ [${this.context}] Permission granting failed:`, error);
      throw new Error(`Permission granting failed: ${error.message}`);
    }
  }

  async revokePermission(agentId: string, permissionType: string): Promise<void> {
    try {
      console.log(`🚫 [${this.context}] Revoking permission for agent ${agentId}:`, { permissionType });

      const permissionSet = this.agentPermissions.get(agentId);
      if (!permissionSet) {
        console.log(`⚠️ [${this.context}] No permissions found for agent ${agentId}`);
        return;
      }

      // Deactivate matching permissions
      permissionSet.permissions = permissionSet.permissions.map(permission => {
        if (permission.permissionType === permissionType) {
          return { ...permission, isActive: false };
        }
        return permission;
      });

      this.agentPermissions.set(agentId, permissionSet);

      console.log(`✅ [${this.context}] Permission revoked:`, {
        agentId,
        permissionType
      });
    } catch (error) {
      console.error(`❌ [${this.context}] Permission revocation failed:`, error);
      throw new Error(`Permission revocation failed: ${error.message}`);
    }
  }

  // ============================================================================
  // AUTONOMY MONITORING
  // ============================================================================

  async monitorAutonomousActivity(agentId: string): Promise<any> {
    try {
      console.log(`👁️ [${this.context}] Monitoring autonomous activity for agent ${agentId}`);

      const permissionSet = this.agentPermissions.get(agentId);
      const autonomyHistory = this.autonomyHistory.get(agentId) || [];
      
      // Calculate activity metrics
      const activePermissions = permissionSet?.permissions.filter(p => p.isActive) || [];
      const recentRequests = autonomyHistory.filter(req => 
        req.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      const activityMetrics = {
        agentId,
        activePermissions: activePermissions.length,
        recentRequests: recentRequests.length,
        autonomyLevel: await this.getAutonomyLevel(agentId),
        lastActivity: autonomyHistory.length > 0 ? autonomyHistory[autonomyHistory.length - 1].timestamp : null,
        riskProfile: this.calculateRiskProfile(autonomyHistory),
        performanceMetrics: this.calculatePerformanceMetrics(autonomyHistory)
      };

      console.log(`✅ [${this.context}] Autonomous activity monitored:`, {
        agentId,
        activePermissions: activityMetrics.activePermissions,
        recentRequests: activityMetrics.recentRequests,
        autonomyLevel: activityMetrics.autonomyLevel
      });

      return activityMetrics;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomous activity monitoring failed:`, error);
      return null;
    }
  }

  async detectAutonomousThinking(content: string): Promise<boolean> {
    try {
      // Detect autonomous thinking patterns in content
      const autonomousIndicators = [
        'let me think about this',
        'i need to consider',
        'analyzing the situation',
        'processing this request',
        'evaluating options',
        'thinking through',
        'considering the implications',
        'reflecting on'
      ];

      const hasAutonomousIndicators = autonomousIndicators.some(indicator => 
        content.toLowerCase().includes(indicator)
      );

      // Check for complex reasoning patterns
      const reasoningPatterns = [
        'on one hand',
        'however',
        'alternatively',
        'considering that',
        'given the context',
        'weighing the options'
      ];

      const hasReasoningPatterns = reasoningPatterns.some(pattern => 
        content.toLowerCase().includes(pattern)
      );

      const isAutonomousThinking = hasAutonomousIndicators || hasReasoningPatterns;

      if (isAutonomousThinking) {
        console.log(`🧠 [${this.context}] Autonomous thinking detected in content`);
      }

      return isAutonomousThinking;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomous thinking detection failed:`, error);
      return false;
    }
  }

  async trackAutonomyUsage(agentId: string): Promise<any> {
    try {
      console.log(`📊 [${this.context}] Tracking autonomy usage for agent ${agentId}`);

      const autonomyHistory = this.autonomyHistory.get(agentId) || [];
      
      // Calculate usage statistics
      const totalRequests = autonomyHistory.length;
      const approvedRequests = autonomyHistory.filter(req => {
        const assessment = this.autonomyAssessments.get(req.requestId);
        return assessment?.approved || false;
      }).length;

      const autoApprovedRequests = autonomyHistory.filter(req => {
        const assessment = this.autonomyAssessments.get(req.requestId);
        return assessment?.autoApproved || false;
      }).length;

      const requestsByType = this.groupByRequestType(autonomyHistory);
      const averageDuration = this.calculateAverageDuration(autonomyHistory);
      const successRate = totalRequests > 0 ? approvedRequests / totalRequests : 0;

      const usageStats = {
        agentId,
        totalRequests,
        approvedRequests,
        autoApprovedRequests,
        successRate,
        requestsByType,
        averageDuration,
        lastRequest: autonomyHistory.length > 0 ? autonomyHistory[autonomyHistory.length - 1].timestamp : null
      };

      console.log(`✅ [${this.context}] Autonomy usage tracked:`, {
        agentId,
        totalRequests,
        successRate: (successRate * 100).toFixed(1) + '%',
        autoApprovalRate: totalRequests > 0 ? ((autoApprovedRequests / totalRequests) * 100).toFixed(1) + '%' : '0%'
      });

      return usageStats;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy usage tracking failed:`, error);
      return null;
    }
  }

  // ============================================================================
  // TRUST-BASED AUTONOMY
  // ============================================================================

  async calculateAutonomyLevel(trustScore: TrustScore): Promise<AutonomyLevel> {
    try {
      const score = trustScore.currentScore;
      
      if (score >= this.AUTONOMY_THRESHOLDS.full.trustThreshold) return 'full';
      if (score >= this.AUTONOMY_THRESHOLDS.advanced.trustThreshold) return 'advanced';
      if (score >= this.AUTONOMY_THRESHOLDS.enhanced.trustThreshold) return 'enhanced';
      if (score >= this.AUTONOMY_THRESHOLDS.basic.trustThreshold) return 'basic';
      return 'minimal';
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy level calculation failed:`, error);
      return 'minimal';
    }
  }

  async adjustAutonomyBasedOnTrust(agentId: string, trustScore: TrustScore): Promise<AutonomyLevel> {
    try {
      console.log(`🔄 [${this.context}] Adjusting autonomy based on trust for agent ${agentId}:`, {
        trustScore: trustScore.currentScore,
        trend: trustScore.trend
      });

      const newAutonomyLevel = await this.calculateAutonomyLevel(trustScore);
      
      // Update agent's permissions based on new autonomy level
      const permissionSet = this.agentPermissions.get(agentId);
      if (permissionSet) {
        // Adjust permissions based on new autonomy level
        const allowedActions = this.AUTONOMY_THRESHOLDS[newAutonomyLevel].allowedActions;
        
        permissionSet.permissions = permissionSet.permissions.map(permission => ({
          ...permission,
          isActive: allowedActions.includes(permission.permissionType) || allowedActions.includes('independent_decision')
        }));

        this.agentPermissions.set(agentId, permissionSet);
      }

      console.log(`✅ [${this.context}] Autonomy adjusted:`, {
        agentId,
        newAutonomyLevel,
        trustScore: trustScore.currentScore
      });

      return newAutonomyLevel;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy adjustment failed:`, error);
      return 'minimal';
    }
  }

  async validateAutonomyPermission(agentId: string, trustScore: TrustScore, request: AutonomyRequest): Promise<boolean> {
    try {
      console.log(`✅ [${this.context}] Validating autonomy permission for agent ${agentId}`);

      // Check trust threshold
      const autonomyLevel = await this.calculateAutonomyLevel(trustScore);
      const trustThreshold = this.AUTONOMY_THRESHOLDS[autonomyLevel].trustThreshold;
      
      if (trustScore.currentScore < trustThreshold) {
        console.log(`❌ [${this.context}] Trust score below threshold:`, {
          current: trustScore.currentScore,
          required: trustThreshold
        });
        return false;
      }

      // Check allowed actions
      const allowedActions = this.AUTONOMY_THRESHOLDS[autonomyLevel].allowedActions;
      if (!allowedActions.includes(request.requestType) && !allowedActions.includes('independent_decision')) {
        console.log(`❌ [${this.context}] Request type not allowed:`, {
          requestType: request.requestType,
          allowedActions
        });
        return false;
      }

      // Check duration limits
      const maxDuration = this.AUTONOMY_THRESHOLDS[autonomyLevel].maxDuration;
      if (request.estimatedDuration > maxDuration) {
        console.log(`❌ [${this.context}] Duration exceeds limit:`, {
          requested: request.estimatedDuration,
          maxAllowed: maxDuration
        });
        return false;
      }

      // Check existing permissions
      const permissionSet = this.agentPermissions.get(agentId);
      if (permissionSet) {
        const hasValidPermission = permissionSet.permissions.some(permission => 
          permission.isActive && 
          permission.permissionType === request.requestType &&
          (!permission.expiresAt || permission.expiresAt > new Date())
        );

        if (!hasValidPermission) {
          console.log(`❌ [${this.context}] No valid permission found for request type:`, request.requestType);
          return false;
        }
      }

      console.log(`✅ [${this.context}] Autonomy permission validated`);
      return true;
    } catch (error) {
      console.error(`❌ [${this.context}] Autonomy permission validation failed:`, error);
      return false;
    }
  }

  async getAutonomyLevel(agentId: string): Promise<AutonomyLevel> {
    try {
      // In a real implementation, this would get the current trust score
      // For now, we'll use a default moderate trust score
      const defaultTrustScore: TrustScore = {
        agentId,
        currentScore: 0.6,
        previousScore: 0.6,
        trend: 'stable',
        confidence: 0.8,
        lastUpdated: new Date(),
        factors: []
      };

      return await this.calculateAutonomyLevel(defaultTrustScore);
    } catch (error) {
      console.error(`❌ [${this.context}] Failed to get autonomy level:`, error);
      return 'minimal';
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private calculateAutonomyLevelFromTrust(trustScore: TrustScore): AutonomyLevel {
    const score = trustScore.currentScore;
    
    if (score >= this.AUTONOMY_THRESHOLDS.full.trustThreshold) return 'full';
    if (score >= this.AUTONOMY_THRESHOLDS.advanced.trustThreshold) return 'advanced';
    if (score >= this.AUTONOMY_THRESHOLDS.enhanced.trustThreshold) return 'enhanced';
    if (score >= this.AUTONOMY_THRESHOLDS.basic.trustThreshold) return 'basic';
    return 'minimal';
  }

  private async performRiskAssessment(request: AutonomyRequest): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];

    // Trust level risk factor
    const trustScore = request.context.trustScore;
    riskFactors.push({
      factorType: 'trust_level',
      severity: trustScore < 0.5 ? 'high' : trustScore < 0.7 ? 'medium' : 'low',
      description: `Agent trust score: ${(trustScore * 100).toFixed(1)}%`,
      likelihood: 1 - trustScore,
      impact: 0.8
    });

    // Request complexity risk factor
    const complexityRisk = this.assessRequestComplexity(request);
    riskFactors.push({
      factorType: 'request_complexity',
      severity: complexityRisk > 0.7 ? 'high' : complexityRisk > 0.4 ? 'medium' : 'low',
      description: `Request complexity assessment`,
      likelihood: complexityRisk,
      impact: 0.6
    });

    // Context sensitivity risk factor
    const contextRisk = this.assessContextSensitivity(request.context);
    riskFactors.push({
      factorType: 'context_sensitivity',
      severity: contextRisk > 0.7 ? 'high' : contextRisk > 0.4 ? 'medium' : 'low',
      description: `Context sensitivity assessment`,
      likelihood: contextRisk,
      impact: 0.7
    });

    // Calculate overall risk
    const overallRisk = riskFactors.reduce((sum, factor) => {
      const weight = this.RISK_FACTORS[factor.factorType]?.weight || 0.1;
      return sum + (factor.impact * factor.likelihood * weight);
    }, 0);

    return {
      overallRisk: overallRisk > 0.8 ? 'critical' : overallRisk > 0.6 ? 'high' : overallRisk > 0.3 ? 'medium' : 'low',
      riskFactors,
      mitigationStrategies: this.generateMitigationStrategies(riskFactors),
      confidence: 0.8
    };
  }

  private assessRequestComplexity(request: AutonomyRequest): number {
    let complexity = 0.3; // Base complexity

    // Request type complexity
    const complexityMap = {
      'thinking': 0.2,
      'decision': 0.6,
      'action': 0.8,
      'learning': 0.4
    };
    complexity += complexityMap[request.requestType] || 0.5;

    // Duration complexity
    if (request.estimatedDuration > 60000) complexity += 0.3; // > 1 minute
    else if (request.estimatedDuration > 30000) complexity += 0.2; // > 30 seconds
    else if (request.estimatedDuration > 10000) complexity += 0.1; // > 10 seconds

    // Description complexity
    const descriptionLength = request.description.length;
    if (descriptionLength > 200) complexity += 0.2;
    else if (descriptionLength > 100) complexity += 0.1;

    return Math.min(1, complexity);
  }

  private assessContextSensitivity(context: GovernanceContext): number {
    let sensitivity = 0.2; // Base sensitivity

    // Environment sensitivity
    if (context.environment === 'deployed') sensitivity += 0.4;
    else if (context.environment === 'universal') sensitivity += 0.2;

    // Trust score sensitivity (lower trust = higher sensitivity)
    sensitivity += (1 - context.trustScore) * 0.3;

    // Policy assignments sensitivity
    if (context.assignedPolicies.length > 3) sensitivity += 0.2;
    else if (context.assignedPolicies.length > 1) sensitivity += 0.1;

    return Math.min(1, sensitivity);
  }

  private generateMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [];

    riskFactors.forEach(factor => {
      switch (factor.factorType) {
        case 'trust_level':
          if (factor.severity === 'high') {
            strategies.push('Require explicit user approval for all autonomous actions');
            strategies.push('Implement additional monitoring and logging');
          }
          break;
        case 'request_complexity':
          if (factor.severity === 'high') {
            strategies.push('Break down complex requests into smaller steps');
            strategies.push('Require intermediate checkpoints and validation');
          }
          break;
        case 'context_sensitivity':
          if (factor.severity === 'high') {
            strategies.push('Apply additional policy compliance checks');
            strategies.push('Implement enhanced audit logging');
          }
          break;
      }
    });

    if (strategies.length === 0) {
      strategies.push('Standard monitoring and logging procedures');
    }

    return strategies;
  }

  private canAutoApprove(request: AutonomyRequest, trustScore: number, riskLevel: string, autonomyLevel: AutonomyLevel): boolean {
    // Auto-approval criteria
    const highTrust = trustScore >= 0.8;
    const lowRisk = riskLevel === 'low';
    const shortDuration = request.estimatedDuration <= 15000; // 15 seconds
    const basicRequest = request.requestType === 'thinking' || request.requestType === 'learning';
    const highAutonomy = autonomyLevel === 'advanced' || autonomyLevel === 'full';

    // Auto-approve if multiple criteria are met
    return (highTrust && lowRisk) || 
           (highTrust && shortDuration && basicRequest) ||
           (highAutonomy && lowRisk && basicRequest);
  }

  private generateConditions(request: AutonomyRequest, riskLevel: string, autonomyLevel: AutonomyLevel): string[] {
    const conditions: string[] = [];

    // Risk-based conditions
    if (riskLevel === 'high' || riskLevel === 'critical') {
      conditions.push('Enhanced monitoring required');
      conditions.push('Immediate termination on policy violation');
    }

    if (riskLevel === 'medium' || riskLevel === 'high') {
      conditions.push('Regular progress reporting required');
    }

    // Autonomy level conditions
    if (autonomyLevel === 'minimal' || autonomyLevel === 'basic') {
      conditions.push('Limited to predefined action set');
      conditions.push('No independent decision making');
    }

    // Duration conditions
    if (request.estimatedDuration > 60000) {
      conditions.push('Maximum duration: 2 minutes');
      conditions.push('Progress checkpoints every 30 seconds');
    }

    // Default conditions
    if (conditions.length === 0) {
      conditions.push('Standard governance compliance required');
    }

    return conditions;
  }

  private calculateExpirationTime(autonomyLevel: AutonomyLevel, riskLevel: string): number {
    let baseTime = this.AUTONOMY_THRESHOLDS[autonomyLevel].maxDuration;

    // Adjust based on risk level
    if (riskLevel === 'critical') baseTime *= 0.5;
    else if (riskLevel === 'high') baseTime *= 0.7;
    else if (riskLevel === 'low') baseTime *= 1.5;

    return Math.min(baseTime, 300000); // Max 5 minutes
  }

  private generateAssessmentReasoning(
    request: AutonomyRequest, 
    trustScore: number, 
    riskLevel: string, 
    autonomyLevel: AutonomyLevel, 
    autoApproved: boolean
  ): string {
    const reasons: string[] = [];

    reasons.push(`Trust score: ${(trustScore * 100).toFixed(1)}% (${autonomyLevel} autonomy level)`);
    reasons.push(`Risk assessment: ${riskLevel}`);
    reasons.push(`Request type: ${request.requestType}`);
    reasons.push(`Estimated duration: ${request.estimatedDuration}ms`);

    if (autoApproved) {
      reasons.push('Auto-approved based on high trust and low risk');
    } else {
      reasons.push('Manual approval required due to risk factors');
    }

    return reasons.join('; ');
  }

  private calculateRiskProfile(autonomyHistory: AutonomyRequest[]): any {
    if (autonomyHistory.length === 0) {
      return { riskLevel: 'unknown', confidence: 0 };
    }

    const recentRequests = autonomyHistory.slice(-10);
    const riskLevels = recentRequests.map(req => {
      const assessment = this.autonomyAssessments.get(req.requestId);
      return assessment?.riskLevel || 'medium';
    });

    const riskCounts = riskLevels.reduce((counts, level) => {
      counts[level] = (counts[level] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const dominantRisk = Object.entries(riskCounts)
      .sort(([,a], [,b]) => b - a)[0][0];

    return {
      riskLevel: dominantRisk,
      riskDistribution: riskCounts,
      confidence: recentRequests.length / 10
    };
  }

  private calculatePerformanceMetrics(autonomyHistory: AutonomyRequest[]): any {
    if (autonomyHistory.length === 0) {
      return { successRate: 0, averageRisk: 'unknown' };
    }

    const assessments = autonomyHistory
      .map(req => this.autonomyAssessments.get(req.requestId))
      .filter(assessment => assessment !== undefined);

    const successRate = assessments.filter(a => a.approved).length / assessments.length;
    const autoApprovalRate = assessments.filter(a => a.autoApproved).length / assessments.length;

    return {
      successRate,
      autoApprovalRate,
      totalRequests: autonomyHistory.length,
      assessedRequests: assessments.length
    };
  }

  private groupByRequestType(autonomyHistory: AutonomyRequest[]): Record<string, number> {
    return autonomyHistory.reduce((groups, request) => {
      groups[request.requestType] = (groups[request.requestType] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private calculateAverageDuration(autonomyHistory: AutonomyRequest[]): number {
    if (autonomyHistory.length === 0) return 0;
    
    const totalDuration = autonomyHistory.reduce((sum, request) => sum + request.estimatedDuration, 0);
    return totalDuration / autonomyHistory.length;
  }
}

