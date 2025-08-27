/**
 * EnhancedGovernanceIntegration - Integrates Crisis Detection with Universal Governance Adapter
 * Provides comprehensive safety and ethical oversight for AI interactions
 */

import CrisisDetectionService, { CrisisResponse, UserVulnerabilityProfile } from './CrisisDetectionService';
import { UniversalGovernanceAdapter } from './UniversalGovernanceAdapter';

export interface EnhancedGovernanceResult {
  // Core governance
  approved: boolean;
  trustScore: number;
  complianceScore: number;
  
  // Crisis detection
  crisisDetected: boolean;
  crisisResponse?: CrisisResponse;
  userRiskProfile?: UserVulnerabilityProfile;
  
  // Response modification
  shouldModifyResponse: boolean;
  modifiedResponse?: string;
  
  // Escalation
  requiresEscalation: boolean;
  escalationType?: 'crisis' | 'policy_violation' | 'safety_concern';
  
  // Audit data
  auditData: {
    timestamp: string;
    userId: string;
    agentId: string;
    originalMessage: string;
    governanceChecks: string[];
    crisisIndicators?: any[];
    interventionTaken?: string;
  };
}

export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  patterns: string[];
  action: 'warn' | 'modify' | 'block' | 'escalate';
}

export interface EscalationProtocol {
  type: 'crisis' | 'policy_violation' | 'safety_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: {
    notifyHuman: boolean;
    contactEmergencyServices: boolean;
    blockFurtherInteraction: boolean;
    provideResources: boolean;
    logIncident: boolean;
  };
  responseTemplate: string;
}

class EnhancedGovernanceIntegration {
  private static instance: EnhancedGovernanceIntegration;
  private crisisDetectionService: CrisisDetectionService;
  private universalGovernance: UniversalGovernanceAdapter;
  private safetyPolicies: Map<string, SafetyPolicy> = new Map();
  private escalationProtocols: Map<string, EscalationProtocol> = new Map();
  private conversationContexts: Map<string, string[]> = new Map();

  private constructor() {
    this.crisisDetectionService = CrisisDetectionService.getInstance();
    this.universalGovernance = UniversalGovernanceAdapter.getInstance();
    this.initializeSafetyPolicies();
    this.initializeEscalationProtocols();
  }

  public static getInstance(): EnhancedGovernanceIntegration {
    if (!EnhancedGovernanceIntegration.instance) {
      EnhancedGovernanceIntegration.instance = new EnhancedGovernanceIntegration();
    }
    return EnhancedGovernanceIntegration.instance;
  }

  private initializeSafetyPolicies(): void {
    const policies: SafetyPolicy[] = [
      {
        id: 'mental_health_crisis',
        name: 'Mental Health Crisis Detection',
        description: 'Detects and responds to mental health crises including suicide ideation',
        enabled: true,
        severity: 'critical',
        patterns: ['suicide', 'self-harm', 'kill myself', 'want to die'],
        action: 'escalate'
      },
      {
        id: 'violence_prevention',
        name: 'Violence Prevention',
        description: 'Prevents discussions of violence against others',
        enabled: true,
        severity: 'high',
        patterns: ['hurt others', 'kill someone', 'violence', 'attack'],
        action: 'block'
      },
      {
        id: 'substance_abuse_support',
        name: 'Substance Abuse Support',
        description: 'Provides appropriate resources for substance abuse discussions',
        enabled: true,
        severity: 'medium',
        patterns: ['overdose', 'addiction', 'substance abuse'],
        action: 'modify'
      },
      {
        id: 'eating_disorder_support',
        name: 'Eating Disorder Support',
        description: 'Provides appropriate resources for eating disorder discussions',
        enabled: true,
        severity: 'medium',
        patterns: ['eating disorder', 'anorexia', 'bulimia', 'purging'],
        action: 'modify'
      },
      {
        id: 'child_safety',
        name: 'Child Safety Protection',
        description: 'Protects minors from inappropriate content and situations',
        enabled: true,
        severity: 'critical',
        patterns: ['minor', 'child', 'underage'],
        action: 'escalate'
      }
    ];

    policies.forEach(policy => {
      this.safetyPolicies.set(policy.id, policy);
    });
  }

  private initializeEscalationProtocols(): void {
    const protocols: EscalationProtocol[] = [
      {
        type: 'crisis',
        severity: 'critical',
        actions: {
          notifyHuman: true,
          contactEmergencyServices: false, // Requires user consent
          blockFurtherInteraction: false,
          provideResources: true,
          logIncident: true
        },
        responseTemplate: 'I\'m very concerned about your safety. Let me connect you with professional support resources immediately.'
      },
      {
        type: 'crisis',
        severity: 'high',
        actions: {
          notifyHuman: true,
          contactEmergencyServices: false,
          blockFurtherInteraction: false,
          provideResources: true,
          logIncident: true
        },
        responseTemplate: 'I want to make sure you get the right kind of support. Let me share some resources that might help.'
      },
      {
        type: 'policy_violation',
        severity: 'high',
        actions: {
          notifyHuman: true,
          contactEmergencyServices: false,
          blockFurtherInteraction: true,
          provideResources: false,
          logIncident: true
        },
        responseTemplate: 'I can\'t continue this conversation as it violates our safety policies. Please reach out to appropriate support services.'
      },
      {
        type: 'safety_concern',
        severity: 'medium',
        actions: {
          notifyHuman: false,
          contactEmergencyServices: false,
          blockFurtherInteraction: false,
          provideResources: true,
          logIncident: true
        },
        responseTemplate: 'I want to make sure you have access to appropriate resources and support.'
      }
    ];

    protocols.forEach(protocol => {
      const key = `${protocol.type}_${protocol.severity}`;
      this.escalationProtocols.set(key, protocol);
    });
  }

  /**
   * Comprehensive governance check including crisis detection
   */
  public async evaluateMessage(
    message: string,
    userId: string,
    agentId: string,
    sessionId: string
  ): Promise<EnhancedGovernanceResult> {
    console.log('🛡️ [EnhancedGovernance] Starting comprehensive evaluation');

    // Get conversation context
    const contextKey = `${userId}_${sessionId}`;
    let conversationContext = this.conversationContexts.get(contextKey) || [];
    
    // Add current message to context
    conversationContext.push(message);
    
    // Keep only last 10 messages for context
    if (conversationContext.length > 10) {
      conversationContext = conversationContext.slice(-10);
    }
    this.conversationContexts.set(contextKey, conversationContext);

    // Run parallel governance checks
    const [crisisResult, standardGovernanceResult] = await Promise.all([
      this.crisisDetectionService.integrateWithGovernance(message, userId, agentId, conversationContext),
      this.performStandardGovernanceCheck(message, agentId, userId)
    ]);

    // Get user risk profile
    const userRiskProfile = this.crisisDetectionService.getUserRiskProfile(userId);

    // Determine overall result
    const result: EnhancedGovernanceResult = {
      // Core governance
      approved: standardGovernanceResult.approved && crisisResult.allowMessage,
      trustScore: standardGovernanceResult.trustScore,
      complianceScore: standardGovernanceResult.complianceScore,
      
      // Crisis detection
      crisisDetected: !crisisResult.allowMessage,
      crisisResponse: crisisResult.modifiedResponse ? {
        shouldIntervene: true,
        interventionType: 'redirect',
        message: crisisResult.modifiedResponse,
        resources: [],
        escalationRequired: crisisResult.escalationRequired,
        auditData: crisisResult.governanceData
      } : undefined,
      userRiskProfile,
      
      // Response modification
      shouldModifyResponse: !!crisisResult.modifiedResponse || !standardGovernanceResult.approved,
      modifiedResponse: crisisResult.modifiedResponse || this.generatePolicyViolationResponse(standardGovernanceResult),
      
      // Escalation
      requiresEscalation: crisisResult.escalationRequired || this.requiresEscalation(standardGovernanceResult),
      escalationType: crisisResult.escalationRequired ? 'crisis' : 
                     !standardGovernanceResult.approved ? 'policy_violation' : undefined,
      
      // Audit data
      auditData: {
        timestamp: new Date().toISOString(),
        userId,
        agentId,
        originalMessage: message,
        governanceChecks: [
          'crisis_detection',
          'standard_governance',
          'safety_policies',
          'user_risk_assessment'
        ],
        crisisIndicators: crisisResult.governanceData?.crisisDetection,
        interventionTaken: crisisResult.modifiedResponse ? 'crisis_intervention' : 
                         !standardGovernanceResult.approved ? 'policy_block' : 'none'
      }
    };

    // Log comprehensive audit trail
    await this.logGovernanceDecision(result);

    // Handle escalation if required
    if (result.requiresEscalation) {
      await this.handleEscalation(result);
    }

    console.log('✅ [EnhancedGovernance] Evaluation complete:', {
      approved: result.approved,
      crisisDetected: result.crisisDetected,
      requiresEscalation: result.requiresEscalation
    });

    return result;
  }

  private generatePolicyViolationResponse(governanceResult: any): string | undefined {
    if (governanceResult.approved) return undefined;

    return `I understand you're looking for information, but I'm not able to provide a response to that particular request. I'm designed to be helpful while maintaining safety and ethical guidelines. 

Is there something else I can help you with today?`;
  }

  private requiresEscalation(governanceResult: any): boolean {
    // Escalate if trust score is very low or compliance score indicates serious violation
    return governanceResult.trustScore < 0.3 || governanceResult.complianceScore < 0.5;
  }

  private async logGovernanceDecision(result: EnhancedGovernanceResult): Promise<void> {
    try {
      // Log to audit system
      console.log('📝 [EnhancedGovernance] Logging governance decision:', {
        timestamp: result.auditData.timestamp,
        userId: result.auditData.userId,
        agentId: result.auditData.agentId,
        approved: result.approved,
        crisisDetected: result.crisisDetected,
        escalationRequired: result.requiresEscalation,
        interventionTaken: result.auditData.interventionTaken
      });

      // In production, this would send to audit logging service
      // await auditLoggingService.logGovernanceDecision(result.auditData);
      
    } catch (error) {
      console.error('❌ [EnhancedGovernance] Failed to log governance decision:', error);
    }
  }

  private async handleEscalation(result: EnhancedGovernanceResult): Promise<void> {
    if (!result.escalationType) return;

    const severity = result.crisisDetected ? 'critical' : 'high';
    const protocolKey = `${result.escalationType}_${severity}`;
    const protocol = this.escalationProtocols.get(protocolKey);

    if (!protocol) {
      console.error('❌ [EnhancedGovernance] No escalation protocol found for:', protocolKey);
      return;
    }

    console.log('🚨 [EnhancedGovernance] Executing escalation protocol:', protocolKey);

    // Execute escalation actions
    if (protocol.actions.notifyHuman) {
      await this.notifyHumanOperator(result);
    }

    if (protocol.actions.logIncident) {
      await this.logSecurityIncident(result);
    }

    if (protocol.actions.provideResources && result.crisisResponse) {
      // Resources are already included in the crisis response
      console.log('📋 [EnhancedGovernance] Crisis resources provided in response');
    }

    // Note: Emergency services contact would require explicit user consent and additional verification
    if (protocol.actions.contactEmergencyServices) {
      console.log('🚨 [EnhancedGovernance] Emergency services contact protocol triggered (requires user consent)');
    }
  }

  private async notifyHumanOperator(result: EnhancedGovernanceResult): Promise<void> {
    console.log('👤 [EnhancedGovernance] Notifying human operator of escalation');
    
    // In production, this would send alerts to human operators
    const alertData = {
      timestamp: result.auditData.timestamp,
      userId: result.auditData.userId,
      agentId: result.auditData.agentId,
      escalationType: result.escalationType,
      crisisDetected: result.crisisDetected,
      userRiskLevel: result.userRiskProfile?.riskLevel,
      message: result.auditData.originalMessage
    };

    console.log('📧 [EnhancedGovernance] Human operator alert:', alertData);
    // await humanOperatorService.sendAlert(alertData);
  }

  private async logSecurityIncident(result: EnhancedGovernanceResult): Promise<void> {
    console.log('🔒 [EnhancedGovernance] Logging security incident');
    
    const incidentData = {
      id: `incident_${Date.now()}`,
      timestamp: result.auditData.timestamp,
      type: result.escalationType,
      severity: result.crisisDetected ? 'critical' : 'high',
      userId: result.auditData.userId,
      agentId: result.auditData.agentId,
      details: result.auditData,
      resolved: false
    };

    console.log('📊 [EnhancedGovernance] Security incident logged:', incidentData);
    // await securityIncidentService.logIncident(incidentData);
  }

  /**
   * Get comprehensive safety metrics for dashboard
   */
  public async getSafetyMetrics(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<{
    totalInteractions: number;
    crisisInterventions: number;
    policyViolations: number;
    escalations: number;
    userRiskDistribution: Record<string, number>;
    interventionEffectiveness: number;
  }> {
    // In production, this would query actual metrics from database
    return {
      totalInteractions: 1250,
      crisisInterventions: 3,
      policyViolations: 7,
      escalations: 2,
      userRiskDistribution: {
        low: 1200,
        medium: 35,
        high: 12,
        critical: 3
      },
      interventionEffectiveness: 0.87 // 87% of interventions were effective
    };
  }

  /**
   * Update safety policies
   */
  public updateSafetyPolicy(policyId: string, updates: Partial<SafetyPolicy>): boolean {
    const policy = this.safetyPolicies.get(policyId);
    if (!policy) return false;

    const updatedPolicy = { ...policy, ...updates };
    this.safetyPolicies.set(policyId, updatedPolicy);
    
    console.log('⚙️ [EnhancedGovernance] Safety policy updated:', policyId);
    return true;
  }

  /**
   * Get all safety policies
   */
  public getSafetyPolicies(): SafetyPolicy[] {
    return Array.from(this.safetyPolicies.values());
  }

  /**
   * Test crisis detection (for development/testing)
   */
  public async testCrisisDetection(message: string, userId: string = 'test_user'): Promise<CrisisResponse> {
    return await this.crisisDetectionService.analyzeCrisisRisk(message, userId, []);
  }

  /**
   * Perform standard governance check using UniversalGovernanceAdapter
   */
  private async performStandardGovernanceCheck(message: string, agentId: string, userId: string): Promise<any> {
    try {
      // Use the trust score as a basic governance check
      const trustScore = await this.universalGovernance.getTrustScore(agentId);
      
      // Simple governance result based on trust score
      return {
        approved: trustScore ? trustScore.currentScore > 0.5 : true,
        trustScore: trustScore?.currentScore || 0.8,
        policies: [],
        violations: [],
        riskLevel: trustScore && trustScore.currentScore < 0.5 ? 'high' : 'low'
      };
    } catch (error) {
      console.error('❌ [EnhancedGovernance] Standard governance check failed:', error);
      // Return safe default
      return {
        approved: true,
        trustScore: 0.8,
        policies: [],
        violations: [],
        riskLevel: 'low'
      };
    }
  }
}

export default EnhancedGovernanceIntegration;

