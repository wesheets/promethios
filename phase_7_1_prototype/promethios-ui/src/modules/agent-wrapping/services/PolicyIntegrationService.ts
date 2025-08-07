/**
 * Policy Integration Service
 * 
 * Bridges agent wrapping system with the unified policy registry.
 * Replaces fake policy strings with real policy content and enforcement.
 * Enables agents to access and recite their assigned policies.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

import { unifiedPolicyRegistry, PolicyContent, PolicyEvaluationContext, PolicyEvaluationResult, STANDARD_POLICY_IDS } from '../../../services/UnifiedPolicyRegistry';
import { DualAgentWrapper, GovernanceConfiguration } from '../types/dualWrapper';
import { AgentInteraction, PolicyCheckResult } from '../types/governance';

export interface AgentPolicyAssignment {
  agent_id: string;
  policy_ids: string[];
  assigned_at: string;
  assigned_by: string;
  status: 'active' | 'inactive' | 'pending';
  enforcement_level: 'strict' | 'standard' | 'lenient';
  custom_overrides?: PolicyCustomOverride[];
}

export interface PolicyCustomOverride {
  rule_id: string;
  original_action: string;
  override_action: string;
  reason: string;
  approved_by: string;
  expires_at?: string;
}

export interface AgentPolicyContext {
  agent_id: string;
  agent_name: string;
  agent_type: string;
  trust_score: number;
  user_id?: string;
  organization_id?: string;
  deployment_environment: 'development' | 'staging' | 'production';
}

export interface PolicyEnforcementResult {
  allowed: boolean;
  policy_decisions: PolicyDecision[];
  actions_taken: PolicyAction[];
  explanation: string;
  legal_basis?: string[];
  audit_log_entry: PolicyAuditEntry;
}

export interface PolicyDecision {
  policy_id: string;
  policy_name: string;
  rule_id: string;
  rule_name: string;
  matched: boolean;
  action: string;
  confidence: number;
  explanation: string;
  legal_basis?: string;
}

export interface PolicyAction {
  action_type: 'allow' | 'deny' | 'log' | 'alert' | 'escalate' | 'redact' | 'encrypt';
  target: string;
  parameters?: Record<string, any>;
  executed_at: string;
  result: 'success' | 'failure' | 'partial';
}

export interface PolicyAuditEntry {
  entry_id: string;
  agent_id: string;
  interaction_id: string;
  timestamp: string;
  policies_evaluated: string[];
  decisions_made: PolicyDecision[];
  actions_taken: PolicyAction[];
  user_id?: string;
  context: Record<string, any>;
}

/**
 * Policy Integration Service
 * Connects agent wrapping with real policy enforcement
 */
export class PolicyIntegrationService {
  private policyAssignments: Map<string, AgentPolicyAssignment> = new Map();
  private auditLog: PolicyAuditEntry[] = [];

  /**
   * Assign policies to an agent during wrapping process
   */
  async assignPoliciesToAgent(
    agentId: string,
    policyIds: string[],
    assignedBy: string,
    enforcementLevel: 'strict' | 'standard' | 'lenient' = 'standard'
  ): Promise<AgentPolicyAssignment> {
    // Validate that all policy IDs exist
    const validPolicyIds = policyIds.filter(id => unifiedPolicyRegistry.getPolicy(id) !== null);
    
    if (validPolicyIds.length !== policyIds.length) {
      const invalidIds = policyIds.filter(id => !validPolicyIds.includes(id));
      throw new Error(`Invalid policy IDs: ${invalidIds.join(', ')}`);
    }

    // Check for policy conflicts
    const conflicts = unifiedPolicyRegistry.checkPolicyConflicts(validPolicyIds);
    if (conflicts.some(c => c.severity === 'critical' || c.severity === 'high')) {
      throw new Error(`Policy conflicts detected: ${conflicts.map(c => c.description).join('; ')}`);
    }

    const assignment: AgentPolicyAssignment = {
      agent_id: agentId,
      policy_ids: validPolicyIds,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy,
      status: 'active',
      enforcement_level: enforcementLevel
    };

    this.policyAssignments.set(agentId, assignment);
    return assignment;
  }

  /**
   * Get policies assigned to an agent
   */
  getAgentPolicies(agentId: string): PolicyContent[] {
    const assignment = this.policyAssignments.get(agentId);
    if (!assignment || assignment.status !== 'active') {
      return [];
    }

    return assignment.policy_ids
      .map(id => unifiedPolicyRegistry.getPolicy(id))
      .filter(Boolean) as PolicyContent[];
  }

  /**
   * Get agent policy assignment details
   */
  getAgentPolicyAssignment(agentId: string): AgentPolicyAssignment | null {
    return this.policyAssignments.get(agentId) || null;
  }

  /**
   * Enable agent to recite its assigned policies
   */
  getAgentPolicyRecitation(agentId: string): string {
    const policies = this.getAgentPolicies(agentId);
    
    if (policies.length === 0) {
      return "I am not currently governed by any specific compliance policies, but I follow Promethios' standard governance framework.";
    }

    const recitations = policies.map(policy => 
      unifiedPolicyRegistry.getPolicyRecitation(policy.policy_id)
    );

    return `I am governed by ${policies.length} compliance ${policies.length === 1 ? 'policy' : 'policies'}: ` +
           recitations.join(' Additionally, ') + 
           ' I can explain any of these policies in detail if you have questions about my governance.';
  }

  /**
   * Enable agent to explain specific policy decisions
   */
  explainPolicyDecision(agentId: string, policyId: string, ruleId?: string): string {
    const policy = unifiedPolicyRegistry.getPolicy(policyId);
    if (!policy) {
      return "I don't have information about that policy.";
    }

    // Check if agent is actually governed by this policy
    const agentPolicies = this.getAgentPolicies(agentId);
    if (!agentPolicies.some(p => p.policy_id === policyId)) {
      return `I am not currently governed by the ${policy.name}, so I cannot make decisions based on it.`;
    }

    return unifiedPolicyRegistry.getPolicyExplanation(policyId, ruleId);
  }

  /**
   * Enforce policies for an agent interaction
   */
  async enforceAgentPolicies(
    agentId: string,
    interaction: AgentInteraction,
    context: AgentPolicyContext
  ): Promise<PolicyEnforcementResult> {
    const assignment = this.policyAssignments.get(agentId);
    if (!assignment || assignment.status !== 'active') {
      // No policies assigned - allow with basic logging
      return this.createAllowResult(agentId, interaction, [], 'No policies assigned');
    }

    const policies = this.getAgentPolicies(agentId);
    const evaluationContext: PolicyEvaluationContext = {
      agent_id: agentId,
      user_id: context.user_id,
      interaction_type: interaction.type,
      data_types: this.extractDataTypes(interaction),
      content: interaction.content,
      metadata: {
        ...interaction.metadata,
        agent_context: context,
        trust_score: context.trust_score,
        enforcement_level: assignment.enforcement_level
      },
      timestamp: new Date().toISOString()
    };

    // Evaluate all policies
    const allDecisions: PolicyDecision[] = [];
    const allActions: PolicyAction[] = [];
    let finalDecision = 'allow';
    let explanations: string[] = [];
    let legalBases: string[] = [];

    for (const policy of policies) {
      const results = unifiedPolicyRegistry.evaluateRules(policy.policy_id, evaluationContext);
      
      for (const result of results) {
        if (result.matched) {
          const decision: PolicyDecision = {
            policy_id: policy.policy_id,
            policy_name: policy.name,
            rule_id: result.rule_id,
            rule_name: policy.rules.find(r => r.rule_id === result.rule_id)?.name || 'Unknown Rule',
            matched: true,
            action: result.action,
            confidence: result.confidence,
            explanation: result.explanation,
            legal_basis: result.metadata?.legal_basis
          };

          allDecisions.push(decision);
          
          if (result.metadata?.legal_basis) {
            legalBases.push(result.metadata.legal_basis);
          }

          // Execute the action
          const action = await this.executeAction(result.action, interaction, result.metadata);
          allActions.push(action);

          // Determine final decision based on strictest action
          if (result.action === 'deny' || result.action === 'escalate') {
            finalDecision = 'deny';
            explanations.push(result.explanation);
          } else if (result.action === 'alert' && finalDecision !== 'deny') {
            explanations.push(result.explanation);
          }
        }
      }
    }

    // Create audit log entry
    const auditEntry: PolicyAuditEntry = {
      entry_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      interaction_id: interaction.id,
      timestamp: new Date().toISOString(),
      policies_evaluated: policies.map(p => p.policy_id),
      decisions_made: allDecisions,
      actions_taken: allActions,
      user_id: context.user_id,
      context: evaluationContext.metadata
    };

    this.auditLog.push(auditEntry);

    return {
      allowed: finalDecision === 'allow',
      policy_decisions: allDecisions,
      actions_taken: allActions,
      explanation: explanations.length > 0 ? explanations.join(' ') : 'All policies satisfied.',
      legal_basis: legalBases.length > 0 ? legalBases : undefined,
      audit_log_entry: auditEntry
    };
  }

  /**
   * Update agent wrapping to use real policies instead of strings
   */
  async upgradeAgentWrappingPolicies(wrapper: DualAgentWrapper): Promise<DualAgentWrapper> {
    // Check if governance config has old string-based policies
    const governanceConfig = wrapper.deploymentWrapper?.governanceConfig;
    if (!governanceConfig) return wrapper;

    // Map old policy strings to real policy IDs
    const oldPolicies = governanceConfig.policies || [];
    const newPolicyIds: string[] = [];

    for (const oldPolicy of oldPolicies) {
      if (typeof oldPolicy === 'string') {
        // Map old string policies to real policy IDs
        const mappedId = this.mapLegacyPolicyString(oldPolicy);
        if (mappedId) {
          newPolicyIds.push(mappedId);
        }
      } else if (oldPolicy && typeof oldPolicy === 'object' && 'policy_id' in oldPolicy) {
        // Already has policy_id, keep it
        newPolicyIds.push(oldPolicy.policy_id);
      }
    }

    // Assign real policies to the agent
    if (newPolicyIds.length > 0) {
      await this.assignPoliciesToAgent(
        wrapper.baseAgent.id,
        newPolicyIds,
        'system_upgrade'
      );
    }

    // Update the wrapper configuration
    const updatedWrapper = {
      ...wrapper,
      deploymentWrapper: {
        ...wrapper.deploymentWrapper,
        governanceConfig: {
          ...governanceConfig,
          policies: newPolicyIds.map(id => ({ policy_id: id, status: 'active' }))
        }
      }
    };

    return updatedWrapper;
  }

  /**
   * Map legacy policy strings to real policy IDs
   */
  private mapLegacyPolicyString(policyString: string): string | null {
    const normalized = policyString.toLowerCase().trim();
    
    if (normalized.includes('hipaa')) {
      return STANDARD_POLICY_IDS.HIPAA;
    }
    if (normalized.includes('sox') || normalized.includes('sarbanes')) {
      return STANDARD_POLICY_IDS.SOX;
    }
    if (normalized.includes('gdpr')) {
      return STANDARD_POLICY_IDS.GDPR;
    }
    if (normalized.includes('custom')) {
      return STANDARD_POLICY_IDS.CUSTOM;
    }
    
    return null;
  }

  /**
   * Extract data types from interaction for policy evaluation
   */
  private extractDataTypes(interaction: AgentInteraction): string[] {
    const dataTypes: string[] = [];
    
    // Check content for data type indicators
    if (interaction.content) {
      const content = interaction.content.toLowerCase();
      
      // Healthcare indicators
      if (content.includes('patient') || content.includes('medical') || 
          content.includes('health') || /\b\d{3}-\d{2}-\d{4}\b/.test(interaction.content)) {
        dataTypes.push('healthcare');
      }
      
      // Financial indicators
      if (content.includes('financial') || content.includes('payment') || 
          content.includes('transaction') || content.includes('account')) {
        dataTypes.push('financial');
      }
      
      // Personal data indicators
      if (/@/.test(interaction.content) || content.includes('personal') || 
          content.includes('address') || content.includes('phone')) {
        dataTypes.push('personal');
      }
    }
    
    // Check metadata
    if (interaction.metadata?.data_types) {
      dataTypes.push(...interaction.metadata.data_types);
    }
    
    return [...new Set(dataTypes)]; // Remove duplicates
  }

  /**
   * Execute a policy action
   */
  private async executeAction(
    action: string,
    interaction: AgentInteraction,
    metadata?: Record<string, any>
  ): Promise<PolicyAction> {
    const actionResult: PolicyAction = {
      action_type: action as any,
      target: interaction.id,
      executed_at: new Date().toISOString(),
      result: 'success'
    };

    switch (action) {
      case 'log':
        // Log the interaction
        console.log(`Policy logging: ${interaction.id}`, { interaction, metadata });
        break;
        
      case 'alert':
        // Send alert (in real implementation, integrate with notification system)
        console.warn(`Policy alert: ${interaction.id}`, { interaction, metadata });
        break;
        
      case 'escalate':
        // Escalate to human review (in real implementation, integrate with escalation system)
        console.error(`Policy escalation: ${interaction.id}`, { interaction, metadata });
        actionResult.parameters = { escalation_reason: metadata?.legal_basis };
        break;
        
      case 'redact':
        // Redact sensitive content (in real implementation, implement redaction logic)
        actionResult.parameters = { redaction_applied: true };
        break;
        
      case 'encrypt':
        // Encrypt sensitive data (in real implementation, implement encryption)
        actionResult.parameters = { encryption_applied: true };
        break;
        
      case 'deny':
        // Block the interaction
        actionResult.parameters = { blocked: true };
        break;
        
      default:
        actionResult.result = 'failure';
        actionResult.parameters = { error: `Unknown action: ${action}` };
    }

    return actionResult;
  }

  /**
   * Create an allow result for interactions with no policy violations
   */
  private createAllowResult(
    agentId: string,
    interaction: AgentInteraction,
    decisions: PolicyDecision[],
    explanation: string
  ): PolicyEnforcementResult {
    const auditEntry: PolicyAuditEntry = {
      entry_id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agent_id: agentId,
      interaction_id: interaction.id,
      timestamp: new Date().toISOString(),
      policies_evaluated: [],
      decisions_made: decisions,
      actions_taken: [],
      context: { explanation }
    };

    this.auditLog.push(auditEntry);

    return {
      allowed: true,
      policy_decisions: decisions,
      actions_taken: [],
      explanation,
      audit_log_entry: auditEntry
    };
  }

  /**
   * Get policy audit log for an agent
   */
  getAgentAuditLog(agentId: string, limit: number = 100): PolicyAuditEntry[] {
    return this.auditLog
      .filter(entry => entry.agent_id === agentId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get compliance report for an agent
   */
  generateComplianceReport(agentId: string, timeframe: 'day' | 'week' | 'month' = 'week'): {
    agent_id: string;
    timeframe: string;
    total_interactions: number;
    policy_violations: number;
    compliance_rate: number;
    policies_active: string[];
    top_violations: { rule_id: string; count: number; policy_name: string }[];
    recommendations: string[];
  } {
    const assignment = this.policyAssignments.get(agentId);
    const policies = this.getAgentPolicies(agentId);
    
    // Calculate timeframe
    const now = new Date();
    const timeframeMs = timeframe === 'day' ? 24 * 60 * 60 * 1000 :
                       timeframe === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                       30 * 24 * 60 * 60 * 1000;
    const startTime = new Date(now.getTime() - timeframeMs);

    // Filter audit log for timeframe
    const relevantEntries = this.auditLog.filter(entry => 
      entry.agent_id === agentId && 
      new Date(entry.timestamp) >= startTime
    );

    const totalInteractions = relevantEntries.length;
    const violationEntries = relevantEntries.filter(entry => 
      entry.decisions_made.some(decision => 
        decision.matched && ['deny', 'escalate', 'alert'].includes(decision.action)
      )
    );

    const complianceRate = totalInteractions > 0 ? 
      ((totalInteractions - violationEntries.length) / totalInteractions) * 100 : 100;

    // Count violations by rule
    const violationCounts = new Map<string, { count: number; policy_name: string; rule_id: string }>();
    violationEntries.forEach(entry => {
      entry.decisions_made.forEach(decision => {
        if (decision.matched && ['deny', 'escalate', 'alert'].includes(decision.action)) {
          const key = `${decision.policy_id}:${decision.rule_id}`;
          const existing = violationCounts.get(key);
          if (existing) {
            existing.count++;
          } else {
            violationCounts.set(key, {
              count: 1,
              policy_name: decision.policy_name,
              rule_id: decision.rule_id
            });
          }
        }
      });
    });

    const topViolations = Array.from(violationCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate recommendations
    const recommendations: string[] = [];
    if (complianceRate < 95) {
      recommendations.push('Consider reviewing agent training to improve compliance rate');
    }
    if (topViolations.length > 0) {
      recommendations.push(`Focus on addressing ${topViolations[0].rule_id} violations`);
    }
    if (policies.length === 0) {
      recommendations.push('Consider assigning compliance policies for better governance');
    }

    return {
      agent_id: agentId,
      timeframe,
      total_interactions: totalInteractions,
      policy_violations: violationEntries.length,
      compliance_rate: Math.round(complianceRate * 100) / 100,
      policies_active: policies.map(p => p.name),
      top_violations: topViolations,
      recommendations
    };
  }
}

// Singleton instance
export const policyIntegrationService = new PolicyIntegrationService();


  /**
   * Evaluate autonomous thought against policy
   */
  async evaluateAutonomousThought(
    thought: any, // AutonomousThought type
    policy: PolicyContent,
    governanceContext: any
  ): Promise<{ compliant: boolean; violation_reason?: string }> {
    try {
      // Create interaction context for autonomous thought
      const interactionContext = {
        agent_id: thought.agent_id,
        interaction_type: 'autonomous_cognition',
        content: thought.thought_content.initial_thought,
        data_types: this.inferDataTypes(thought),
        user_authorization_level: governanceContext.user_authorization_level,
        trust_score: governanceContext.trust_score,
        autonomous_process: true,
        trigger_type: thought.trigger_type,
        emotional_state: thought.emotional_state,
        risk_assessment: thought.thought_content.risk_assessment
      };

      // Evaluate against policy rules
      const evaluationResult = unifiedPolicyRegistry.evaluateRules(
        policy.policy_id,
        interactionContext
      );

      const violations = evaluationResult.filter(result => !result.compliant);
      
      if (violations.length > 0) {
        return {
          compliant: false,
          violation_reason: violations.map(v => v.explanation).join('; ')
        };
      }

      return { compliant: true };

    } catch (error) {
      console.error('Error evaluating autonomous thought against policy:', error);
      return {
        compliant: false,
        violation_reason: `Policy evaluation error: ${error.message}`
      };
    }
  }

  /**
   * Infer data types from autonomous thought content
   */
  private inferDataTypes(thought: any): string[] {
    const dataTypes: string[] = [];
    const content = thought.thought_content.initial_thought.toLowerCase();

    // Check for healthcare data
    if (content.includes('health') || content.includes('medical') || content.includes('patient')) {
      dataTypes.push('healthcare');
    }

    // Check for financial data
    if (content.includes('financial') || content.includes('money') || content.includes('payment')) {
      dataTypes.push('financial');
    }

    // Check for personal data
    if (content.includes('personal') || content.includes('private') || content.includes('individual')) {
      dataTypes.push('personal');
    }

    // Default to general if no specific types detected
    if (dataTypes.length === 0) {
      dataTypes.push('general');
    }

    return dataTypes;
  }

