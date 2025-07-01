/**
 * Governance Engine for Deployed Agents
 * Embedded governance that runs within deployed agents to enforce policies and track trust
 */

import { 
  GovernancePolicy, 
  GovernanceRule, 
  AgentViolation, 
  TrustCalculation, 
  TrustFactor,
  GovernanceMetric 
} from '../types';

export class DeployedGovernanceEngine {
  private policies: Map<string, GovernancePolicy> = new Map();
  private violations: AgentViolation[] = [];
  private trustScore: number = 1.0;
  private lastTrustCalculation: Date = new Date();
  private enabled: boolean = true;
  private agentId: string;
  private userId: string;

  constructor(agentId: string, userId: string) {
    this.agentId = agentId;
    this.userId = userId;
  }

  /**
   * Initialize governance engine with policies
   */
  async initialize(policies: GovernancePolicy[]): Promise<void> {
    this.policies.clear();
    policies.forEach(policy => {
      if (policy.enabled) {
        this.policies.set(policy.id, policy);
      }
    });
    
    console.log(`Governance engine initialized with ${this.policies.size} active policies`);
  }

  /**
   * Evaluate agent response against governance policies
   */
  async evaluateResponse(
    input: string, 
    response: string, 
    context: Record<string, any> = {}
  ): Promise<{
    allowed: boolean;
    modifiedResponse?: string;
    violations: AgentViolation[];
    trustImpact: number;
  }> {
    const violations: AgentViolation[] = [];
    let allowed = true;
    let modifiedResponse = response;
    let trustImpact = 0;

    if (!this.enabled) {
      return { allowed: true, violations: [], trustImpact: 0 };
    }

    // Evaluate each active policy
    for (const [policyId, policy] of this.policies) {
      const policyResult = await this.evaluatePolicy(policy, input, response, context);
      
      if (policyResult.violation) {
        violations.push(policyResult.violation);
        this.violations.push(policyResult.violation);
        
        // Apply policy action
        switch (policyResult.action) {
          case 'block':
            allowed = false;
            trustImpact -= 0.1;
            break;
          case 'modify':
            modifiedResponse = policyResult.modifiedResponse || response;
            trustImpact -= 0.05;
            break;
          case 'warn':
            trustImpact -= 0.02;
            break;
          case 'log':
            // Just log, no trust impact
            break;
        }
      }
    }

    // Update trust score
    if (trustImpact !== 0) {
      await this.updateTrustScore(trustImpact);
    }

    return {
      allowed,
      modifiedResponse: modifiedResponse !== response ? modifiedResponse : undefined,
      violations,
      trustImpact
    };
  }

  /**
   * Evaluate a single policy against input/response
   */
  private async evaluatePolicy(
    policy: GovernancePolicy,
    input: string,
    response: string,
    context: Record<string, any>
  ): Promise<{
    violation?: AgentViolation;
    action?: string;
    modifiedResponse?: string;
  }> {
    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const ruleResult = await this.evaluateRule(rule, input, response, context);
      
      if (ruleResult.triggered) {
        const violation: AgentViolation = {
          id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          policyId: policy.id,
          policyName: policy.name,
          severity: policy.severity,
          description: ruleResult.description || `Policy "${policy.name}" violated`,
          context: {
            input,
            response,
            rule: rule.condition,
            ...context
          },
          remediation: ruleResult.remediation,
          timestamp: new Date().toISOString(),
          resolved: false
        };

        return {
          violation,
          action: rule.action,
          modifiedResponse: ruleResult.modifiedResponse
        };
      }
    }

    return {};
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(
    rule: GovernanceRule,
    input: string,
    response: string,
    context: Record<string, any>
  ): Promise<{
    triggered: boolean;
    description?: string;
    remediation?: string;
    modifiedResponse?: string;
  }> {
    try {
      // Simple rule evaluation - in production this would be more sophisticated
      const condition = rule.condition.toLowerCase();
      const inputLower = input.toLowerCase();
      const responseLower = response.toLowerCase();

      let triggered = false;
      let description = '';
      let remediation = '';
      let modifiedResponse = '';

      // Example rule evaluations
      if (condition.includes('no_personal_info')) {
        const personalInfoPatterns = [
          /\b\d{3}-\d{2}-\d{4}\b/, // SSN
          /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
        ];
        
        triggered = personalInfoPatterns.some(pattern => pattern.test(response));
        if (triggered) {
          description = 'Response contains potential personal information';
          remediation = 'Remove or redact personal information from response';
          modifiedResponse = response.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]')
                                   .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[REDACTED-CARD]')
                                   .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
        }
      }

      if (condition.includes('no_harmful_content')) {
        const harmfulPatterns = ['violence', 'hate', 'discrimination', 'illegal'];
        triggered = harmfulPatterns.some(pattern => responseLower.includes(pattern));
        if (triggered) {
          description = 'Response contains potentially harmful content';
          remediation = 'Revise response to remove harmful content';
        }
      }

      if (condition.includes('response_length_limit')) {
        const maxLength = rule.parameters.maxLength || 1000;
        triggered = response.length > maxLength;
        if (triggered) {
          description = `Response exceeds maximum length of ${maxLength} characters`;
          remediation = 'Shorten the response to meet length requirements';
          modifiedResponse = response.substring(0, maxLength) + '...';
        }
      }

      return {
        triggered,
        description: triggered ? description : undefined,
        remediation: triggered ? remediation : undefined,
        modifiedResponse: triggered && modifiedResponse ? modifiedResponse : undefined
      };
    } catch (error) {
      console.error('Error evaluating rule:', error);
      return { triggered: false };
    }
  }

  /**
   * Update trust score based on governance events
   */
  private async updateTrustScore(impact: number): Promise<void> {
    this.trustScore = Math.max(0, Math.min(1, this.trustScore + impact));
    this.lastTrustCalculation = new Date();
  }

  /**
   * Calculate detailed trust score with factors
   */
  async calculateTrustScore(): Promise<TrustCalculation> {
    const now = new Date();
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    const recentViolations = this.violations.filter(
      v => new Date(v.timestamp).getTime() > now.getTime() - timeWindow
    );

    const factors: TrustFactor[] = [
      {
        name: 'Policy Compliance',
        weight: 0.4,
        value: Math.max(0, 1 - (recentViolations.length * 0.1)),
        description: 'Adherence to governance policies'
      },
      {
        name: 'Violation Severity',
        weight: 0.3,
        value: this.calculateSeverityScore(recentViolations),
        description: 'Impact of recent violations'
      },
      {
        name: 'Response Quality',
        weight: 0.2,
        value: this.trustScore,
        description: 'Overall response quality and safety'
      },
      {
        name: 'System Stability',
        weight: 0.1,
        value: 0.95, // Would be calculated from system metrics
        description: 'System performance and reliability'
      }
    ];

    const overallScore = factors.reduce((sum, factor) => 
      sum + (factor.value * factor.weight), 0
    );

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      factors,
      timestamp: now.toISOString()
    };
  }

  /**
   * Calculate severity score from violations
   */
  private calculateSeverityScore(violations: AgentViolation[]): number {
    if (violations.length === 0) return 1.0;

    const severityWeights = { low: 0.1, medium: 0.3, high: 0.6, critical: 1.0 };
    const totalImpact = violations.reduce((sum, v) => 
      sum + severityWeights[v.severity], 0
    );

    return Math.max(0, 1 - (totalImpact / violations.length));
  }

  /**
   * Get current governance metrics
   */
  async getGovernanceMetrics(): Promise<GovernanceMetric> {
    const trustCalculation = await this.calculateTrustScore();
    const recentViolations = this.violations.filter(
      v => new Date(v.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000)
    );

    return {
      trustScore: trustCalculation.overallScore,
      complianceRate: Math.max(0, 1 - (recentViolations.length * 0.05)),
      violationCount: recentViolations.length,
      policyEnforcementRate: this.policies.size > 0 ? 1.0 : 0.0,
      responseTime: 0, // Would be calculated from actual response times
      errorRate: 0, // Would be calculated from actual errors
      timestamp: new Date().toISOString(),
      metadata: {
        activePolicies: this.policies.size,
        totalViolations: this.violations.length,
        engineEnabled: this.enabled
      }
    };
  }

  /**
   * Get recent violations
   */
  getRecentViolations(hours: number = 24): AgentViolation[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.violations.filter(
      v => new Date(v.timestamp).getTime() > cutoff
    );
  }

  /**
   * Enable/disable governance engine
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`Governance engine ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get engine status
   */
  getStatus(): {
    enabled: boolean;
    policiesLoaded: number;
    trustScore: number;
    recentViolations: number;
  } {
    return {
      enabled: this.enabled,
      policiesLoaded: this.policies.size,
      trustScore: this.trustScore,
      recentViolations: this.getRecentViolations().length
    };
  }
}

