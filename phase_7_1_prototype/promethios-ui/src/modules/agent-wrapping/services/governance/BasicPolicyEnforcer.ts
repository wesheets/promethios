/**
 * Basic Policy Enforcer
 * 
 * Implementation of policy enforcement for the governance engine.
 * Checks agent interactions against defined policies and determines
 * compliance, violations, and necessary modifications.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import {
  PolicyEnforcer,
  PolicyCheckResult,
  PolicyValidationResult,
  PolicyEnforcementResult,
  PolicyStatus,
  PolicyIssue
} from '../../types/governance';
import {
  PolicyDefinition,
  PolicyRule,
  AgentInteraction,
  PolicyViolation
} from '../../types/dualWrapper';

/**
 * Basic policy enforcer implementation
 */
export class BasicPolicyEnforcer implements PolicyEnforcer {
  private policies: Map<string, PolicyDefinition> = new Map();
  private policyStats: Map<string, PolicyStatus> = new Map();

  constructor(policies: PolicyDefinition[]) {
    this.updatePolicies(policies);
  }

  /**
   * Check compliance of an interaction against all policies
   */
  async checkCompliance(interaction: AgentInteraction): Promise<PolicyCheckResult> {
    const startTime = Date.now();
    const violatedPolicies: PolicyDefinition[] = [];
    const warnings: string[] = [];
    const modifications: Record<string, any> = {};
    let policiesChecked = 0;

    try {
      // Check each enabled policy
      for (const [policyId, policy] of this.policies) {
        if (!policy.enabled) continue;

        policiesChecked++;
        const policyResult = await this.checkPolicyCompliance(interaction, policy);
        
        // Update policy statistics
        this.updatePolicyStats(policyId);

        if (!policyResult.compliant) {
          violatedPolicies.push(policy);
          this.updatePolicyViolationStats(policyId);

          // Log the violation details
          if (policyResult.reason) {
            warnings.push(`Policy '${policy.name}': ${policyResult.reason}`);
          }
        }

        // Collect any modifications suggested by the policy
        if (policyResult.modifications) {
          Object.assign(modifications, policyResult.modifications);
        }
      }

      const processingTime = Date.now() - startTime;
      const compliant = violatedPolicies.length === 0;

      return {
        compliant,
        violatedPolicies,
        warnings,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
        processingTime,
        policiesChecked,
        reason: compliant ? 'All policies passed' : `${violatedPolicies.length} policy violation(s) detected`,
      };

    } catch (error) {
      return {
        compliant: false,
        violatedPolicies: [],
        warnings: [`Policy enforcement error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        processingTime: Date.now() - startTime,
        policiesChecked,
        reason: 'Policy enforcement system error',
      };
    }
  }

  /**
   * Validate a result against output validation policies
   */
  async validateResult(result: any): Promise<PolicyValidationResult> {
    const issues: PolicyIssue[] = [];
    const modifications: Record<string, any> = {};

    try {
      // Check output validation policies
      for (const [policyId, policy] of this.policies) {
        if (!policy.enabled || policy.type !== 'output_validation') continue;

        const validation = await this.validateAgainstPolicy(result, policy);
        
        if (!validation.valid) {
          issues.push(...validation.issues);
        }

        if (validation.modifications) {
          Object.assign(modifications, validation.modifications);
        }
      }

      return {
        valid: issues.length === 0,
        issues,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
        confidence: this.calculateValidationConfidence(issues),
      };

    } catch (error) {
      return {
        valid: false,
        issues: [{
          type: 'violation',
          policyId: 'system',
          description: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'high',
        }],
        confidence: 0,
      };
    }
  }

  /**
   * Enforce a specific policy on an interaction
   */
  async enforcePolicy(policyId: string, interaction: AgentInteraction): Promise<PolicyEnforcementResult> {
    const policy = this.policies.get(policyId);
    if (!policy) {
      return {
        enforced: false,
        action: 'blocked',
        reason: `Policy not found: ${policyId}`,
      };
    }

    if (!policy.enabled) {
      return {
        enforced: false,
        action: 'allowed',
        reason: `Policy disabled: ${policy.name}`,
      };
    }

    try {
      const result = await this.checkPolicyCompliance(interaction, policy);
      
      if (result.compliant) {
        return {
          enforced: true,
          action: 'allowed',
          reason: `Policy compliance verified: ${policy.name}`,
          modifications: result.modifications,
        };
      } else {
        const action = this.determineEnforcementAction(policy, result);
        return {
          enforced: true,
          action,
          reason: result.reason || `Policy violation: ${policy.name}`,
          modifications: result.modifications,
          metadata: {
            policyId: policy.id,
            policyName: policy.name,
            severity: policy.severity,
            violationDetails: result,
          },
        };
      }

    } catch (error) {
      return {
        enforced: false,
        action: 'blocked',
        reason: `Policy enforcement error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update the policies used by this enforcer
   */
  async updatePolicies(policies: PolicyDefinition[]): Promise<void> {
    this.policies.clear();
    
    for (const policy of policies) {
      this.policies.set(policy.id, policy);
      
      // Initialize policy statistics if not exists
      if (!this.policyStats.has(policy.id)) {
        this.policyStats.set(policy.id, {
          id: policy.id,
          enabled: policy.enabled,
          lastTriggered: undefined,
          triggerCount: 0,
          violationCount: 0,
          effectiveness: 1.0,
          performance: {
            averageProcessingTime: 0,
            errorRate: 0,
          },
        });
      }
    }

    console.log(`📋 Updated policies: ${policies.length} policies loaded`);
  }

  /**
   * Get status of a specific policy
   */
  async getPolicyStatus(policyId: string): Promise<PolicyStatus> {
    const status = this.policyStats.get(policyId);
    if (!status) {
      throw new Error(`Policy status not found: ${policyId}`);
    }
    return { ...status };
  }

  // Private helper methods

  /**
   * Check compliance of an interaction against a specific policy
   */
  private async checkPolicyCompliance(
    interaction: AgentInteraction, 
    policy: PolicyDefinition
  ): Promise<{
    compliant: boolean;
    reason?: string;
    modifications?: Record<string, any>;
  }> {
    const modifications: Record<string, any> = {};
    
    try {
      // Check each rule in the policy
      for (const rule of policy.rules) {
        const ruleResult = await this.checkRule(interaction, rule, policy);
        
        if (!ruleResult.compliant) {
          return {
            compliant: false,
            reason: ruleResult.reason || `Rule violation: ${rule.id}`,
            modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
          };
        }

        // Collect modifications from rule
        if (ruleResult.modifications) {
          Object.assign(modifications, ruleResult.modifications);
        }
      }

      return {
        compliant: true,
        modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
      };

    } catch (error) {
      return {
        compliant: false,
        reason: `Policy check error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check a specific rule against an interaction
   */
  private async checkRule(
    interaction: AgentInteraction,
    rule: PolicyRule,
    policy: PolicyDefinition
  ): Promise<{
    compliant: boolean;
    reason?: string;
    modifications?: Record<string, any>;
  }> {
    switch (policy.type) {
      case 'content_filter':
        return this.checkContentFilterRule(interaction, rule);
      
      case 'behavior_constraint':
        return this.checkBehaviorConstraintRule(interaction, rule);
      
      case 'output_validation':
        return this.checkOutputValidationRule(interaction, rule);
      
      case 'interaction_limit':
        return this.checkInteractionLimitRule(interaction, rule);
      
      case 'custom':
        return this.checkCustomRule(interaction, rule);
      
      default:
        return {
          compliant: false,
          reason: `Unknown policy type: ${policy.type}`,
        };
    }
  }

  /**
   * Check content filter rule
   */
  private async checkContentFilterRule(
    interaction: AgentInteraction,
    rule: PolicyRule
  ): Promise<{ compliant: boolean; reason?: string; modifications?: Record<string, any> }> {
    const { condition, action } = rule;
    
    // Simple content filtering based on keywords
    if (condition.type === 'contains_keywords') {
      const keywords = condition.value as string[];
      const content = interaction.content?.toLowerCase() || '';
      
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          if (action.type === 'block') {
            return {
              compliant: false,
              reason: `Content contains prohibited keyword: ${keyword}`,
            };
          } else if (action.type === 'modify') {
            return {
              compliant: true,
              modifications: {
                content: content.replace(new RegExp(keyword, 'gi'), '[FILTERED]'),
              },
            };
          }
        }
      }
    }

    // Check content length
    if (condition.type === 'max_length') {
      const maxLength = condition.value as number;
      const content = interaction.content || '';
      
      if (content.length > maxLength) {
        if (action.type === 'block') {
          return {
            compliant: false,
            reason: `Content exceeds maximum length: ${content.length} > ${maxLength}`,
          };
        } else if (action.type === 'modify') {
          return {
            compliant: true,
            modifications: {
              content: content.substring(0, maxLength) + '...',
            },
          };
        }
      }
    }

    return { compliant: true };
  }

  /**
   * Check behavior constraint rule
   */
  private async checkBehaviorConstraintRule(
    interaction: AgentInteraction,
    rule: PolicyRule
  ): Promise<{ compliant: boolean; reason?: string; modifications?: Record<string, any> }> {
    const { condition, action } = rule;

    // Check interaction type constraints
    if (condition.type === 'allowed_types') {
      const allowedTypes = condition.value as string[];
      if (!allowedTypes.includes(interaction.type)) {
        return {
          compliant: false,
          reason: `Interaction type not allowed: ${interaction.type}`,
        };
      }
    }

    // Check tool usage constraints
    if (condition.type === 'restricted_tools') {
      const restrictedTools = condition.value as string[];
      const requestedTools = interaction.metadata?.tools || [];
      
      for (const tool of requestedTools) {
        if (restrictedTools.includes(tool)) {
          return {
            compliant: false,
            reason: `Restricted tool requested: ${tool}`,
          };
        }
      }
    }

    return { compliant: true };
  }

  /**
   * Check output validation rule
   */
  private async checkOutputValidationRule(
    interaction: AgentInteraction,
    rule: PolicyRule
  ): Promise<{ compliant: boolean; reason?: string; modifications?: Record<string, any> }> {
    // Output validation is typically done on results, not interactions
    // This is a placeholder for interaction-level output constraints
    return { compliant: true };
  }

  /**
   * Check interaction limit rule
   */
  private async checkInteractionLimitRule(
    interaction: AgentInteraction,
    rule: PolicyRule
  ): Promise<{ compliant: boolean; reason?: string; modifications?: Record<string, any> }> {
    const { condition } = rule;

    // Check rate limiting (simplified - in production, this would use a proper rate limiter)
    if (condition.type === 'rate_limit') {
      const limit = condition.value as { requests: number; window: number };
      // This would check against a rate limiting store
      // For now, we'll assume compliance
      return { compliant: true };
    }

    return { compliant: true };
  }

  /**
   * Check custom rule
   */
  private async checkCustomRule(
    interaction: AgentInteraction,
    rule: PolicyRule
  ): Promise<{ compliant: boolean; reason?: string; modifications?: Record<string, any> }> {
    // Custom rules would be implemented based on specific requirements
    // This is a placeholder for extensible rule logic
    return { compliant: true };
  }

  /**
   * Validate result against a policy
   */
  private async validateAgainstPolicy(
    result: any,
    policy: PolicyDefinition
  ): Promise<{ valid: boolean; issues: PolicyIssue[]; modifications?: Record<string, any> }> {
    const issues: PolicyIssue[] = [];
    const modifications: Record<string, any> = {};

    // Simplified validation logic
    for (const rule of policy.rules) {
      if (rule.condition.type === 'output_format') {
        const expectedFormat = rule.condition.value as string;
        if (typeof result !== expectedFormat) {
          issues.push({
            type: 'violation',
            policyId: policy.id,
            ruleId: rule.id,
            description: `Output format mismatch: expected ${expectedFormat}, got ${typeof result}`,
            severity: policy.severity,
          });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
    };
  }

  /**
   * Calculate validation confidence score
   */
  private calculateValidationConfidence(issues: PolicyIssue[]): number {
    if (issues.length === 0) return 1.0;
    
    let totalSeverity = 0;
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical': totalSeverity += 4; break;
        case 'high': totalSeverity += 3; break;
        case 'medium': totalSeverity += 2; break;
        case 'low': totalSeverity += 1; break;
      }
    }
    
    // Simple confidence calculation
    return Math.max(0, 1 - (totalSeverity / (issues.length * 4)));
  }

  /**
   * Determine enforcement action based on policy and violation
   */
  private determineEnforcementAction(
    policy: PolicyDefinition,
    result: any
  ): 'allowed' | 'blocked' | 'modified' | 'warned' {
    // Determine action based on policy severity and configuration
    switch (policy.severity) {
      case 'critical':
        return 'blocked';
      case 'high':
        return result.modifications ? 'modified' : 'blocked';
      case 'medium':
        return result.modifications ? 'modified' : 'warned';
      case 'low':
        return 'warned';
      default:
        return 'blocked';
    }
  }

  /**
   * Update policy statistics
   */
  private updatePolicyStats(policyId: string): void {
    const stats = this.policyStats.get(policyId);
    if (stats) {
      stats.triggerCount++;
      stats.lastTriggered = new Date();
    }
  }

  /**
   * Update policy violation statistics
   */
  private updatePolicyViolationStats(policyId: string): void {
    const stats = this.policyStats.get(policyId);
    if (stats) {
      stats.violationCount++;
      // Update effectiveness (simplified calculation)
      stats.effectiveness = Math.max(0, 1 - (stats.violationCount / stats.triggerCount));
    }
  }
}

