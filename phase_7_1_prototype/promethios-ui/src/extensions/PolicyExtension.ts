/**
 * Policy Extension for Promethios
 * 
 * Extends the existing governance system to support enterprise custom policies
 * while maintaining compatibility with existing agent governance patterns.
 * Integrates with existing PolicyWizard, PolicyMarketplace, and governance engine.
 */

import { Extension } from './Extension';
import { TrustMetricsExtension } from './TrustMetricsExtension';
import { AuditLogAccessExtension } from './AuditLogAccessExtension';
import { authApiService } from '../services/authApiService';
import { userAgentStorageService } from '../services/UserAgentStorageService';
import { prometheiosPolicyAPI, type PrometheiosPolicy, type PrometheiosPolicyRule } from '../services/api/prometheiosPolicyAPI';
import { policyBackendService, type PolicyRule, type PolicyTemplate } from '../services/policyBackendService';
import type { User } from 'firebase/auth';

// Import existing governance types to maintain compatibility
import type { 
  AgentInteraction, 
  PolicyDefinition, 
  PolicyCheckResult,
  PolicyViolation,
  GovernedInteractionResult
} from '../modules/agent-wrapping/types/governance';

export interface EnterprisePolicyConfig {
  // Policy management settings
  enableCustomPolicies: boolean;
  enablePolicyInheritance: boolean;
  enablePolicyConflictResolution: boolean;
  enablePolicyVersioning: boolean;
  
  // Enterprise settings
  organizationId?: string;
  departmentId?: string;
  complianceFrameworks: string[]; // ['HIPAA', 'SOC2', 'GDPR', etc.]
  
  // Policy enforcement settings
  strictMode: boolean; // If true, enterprise policies override Promethios policies
  allowPolicyOverrides: boolean;
  requireApprovalForNewPolicies: boolean;
  
  // Integration settings
  syncWithExistingPolicies: boolean;
  enableRealTimeValidation: boolean;
  enablePolicyAnalytics: boolean;
}

export interface EnterprisePolicyRule extends PrometheiosPolicyRule {
  // Extended fields for enterprise policies
  enterpriseId: string;
  departmentScope?: string[];
  userScope?: string[];
  agentScope?: string[];
  
  // Compliance mapping
  complianceFramework?: string;
  regulatoryRequirement?: string;
  
  // Business logic
  businessJustification?: string;
  approvedBy?: string;
  approvalDate?: string;
  
  // Inheritance and overrides
  inheritsFrom?: string; // Parent policy rule ID
  overrides?: string; // Promethios policy rule ID that this overrides
  canBeOverridden: boolean;
}

export interface EnterprisePolicy extends PrometheiosPolicy {
  // Extended fields for enterprise policies
  enterpriseId: string;
  organizationId: string;
  departmentId?: string;
  
  // Enhanced rules with enterprise features
  rules: EnterprisePolicyRule[];
  
  // Policy hierarchy
  parentPolicyId?: string;
  childPolicyIds?: string[];
  
  // Compliance and approval
  complianceFrameworks: string[];
  approvalWorkflow: {
    requiredApprovers: string[];
    currentApprovers: string[];
    approvalStatus: 'pending' | 'approved' | 'rejected';
    approvalDate?: string;
  };
  
  // Deployment and versioning
  deploymentStatus: 'draft' | 'testing' | 'deployed' | 'deprecated';
  version: string;
  previousVersionId?: string;
  
  // Analytics and monitoring
  analytics: {
    totalEvaluations: number;
    violationCount: number;
    complianceRate: number;
    lastEvaluated?: string;
  };
}

export interface PolicyConflictResolution {
  conflictId: string;
  conflictType: 'rule_contradiction' | 'priority_conflict' | 'scope_overlap';
  policies: string[]; // Policy IDs involved in conflict
  rules: string[]; // Rule IDs involved in conflict
  
  resolution: {
    strategy: 'enterprise_wins' | 'promethios_wins' | 'merge' | 'manual_review';
    resolvedBy?: string;
    resolvedAt?: string;
    reasoning: string;
  };
  
  impact: {
    affectedAgents: string[];
    affectedInteractions: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface PolicyEvaluationContext {
  agentId: string;
  userId: string;
  organizationId?: string;
  departmentId?: string;
  interaction: AgentInteraction;
  
  // Context for policy evaluation
  trustScore: number;
  complianceHistory: any[];
  currentSession: any;
  
  // Enterprise context
  userRoles: string[];
  departmentPolicies: string[];
  organizationPolicies: string[];
}

export interface EnhancedPolicyCheckResult extends PolicyCheckResult {
  // Additional enterprise policy information
  enterprisePoliciesChecked: number;
  promethiosPoliciesChecked: number;
  conflictsResolved: PolicyConflictResolution[];
  
  // Enhanced violation information
  enterpriseViolations: PolicyViolation[];
  prometheusViolations: PolicyViolation[];
  
  // Policy recommendations
  recommendations: {
    suggestedPolicyChanges: string[];
    optimizationOpportunities: string[];
    complianceImprovements: string[];
  };
}

/**
 * Enhanced Policy Enforcer that extends BasicPolicyEnforcer
 * Adds enterprise policy support while maintaining existing patterns
 */
export class EnhancedPolicyEnforcer {
  private enterprisePolicies: Map<string, EnterprisePolicy> = new Map();
  private promethiosPolicies: Map<string, PolicyDefinition> = new Map();
  private conflictResolutions: Map<string, PolicyConflictResolution> = new Map();
  private config: EnterprisePolicyConfig;

  constructor(config: EnterprisePolicyConfig) {
    this.config = config;
  }

  /**
   * Enhanced compliance check that follows existing agent patterns
   * but adds enterprise policy support
   */
  async checkCompliance(
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<EnhancedPolicyCheckResult> {
    const startTime = Date.now();
    
    // Initialize result structure
    const result: EnhancedPolicyCheckResult = {
      compliant: true,
      violatedPolicies: [],
      warnings: [],
      modifications: {},
      processingTime: 0,
      policiesChecked: 0,
      reason: '',
      
      // Enhanced fields
      enterprisePoliciesChecked: 0,
      promethiosPoliciesChecked: 0,
      conflictsResolved: [],
      enterpriseViolations: [],
      prometheusViolations: [],
      recommendations: {
        suggestedPolicyChanges: [],
        optimizationOpportunities: [],
        complianceImprovements: []
      }
    };

    try {
      // 1. Check Promethios base policies first (existing pattern)
      const prometheusResult = await this.checkPromethiosPolicies(interaction, context);
      result.promethiosPoliciesChecked = prometheusResult.policiesChecked || 0;
      result.prometheusViolations = prometheusResult.violatedPolicies.map(p => this.createViolation(p, interaction, context));

      // 2. Check enterprise policies
      const enterpriseResult = await this.checkEnterprisePolicies(interaction, context);
      result.enterprisePoliciesChecked = enterpriseResult.policiesChecked || 0;
      result.enterpriseViolations = enterpriseResult.violatedPolicies.map(p => this.createViolation(p, interaction, context));

      // 3. Resolve policy conflicts
      const conflicts = await this.detectPolicyConflicts(prometheusResult, enterpriseResult, context);
      result.conflictsResolved = await this.resolvePolicyConflicts(conflicts, context);

      // 4. Determine final compliance status
      const finalResult = this.determineFinalCompliance(prometheusResult, enterpriseResult, result.conflictsResolved);
      
      result.compliant = finalResult.compliant;
      result.violatedPolicies = finalResult.violatedPolicies;
      result.warnings = finalResult.warnings;
      result.modifications = finalResult.modifications;
      result.reason = finalResult.reason;

      // 5. Generate recommendations
      result.recommendations = await this.generatePolicyRecommendations(result, context);

      result.processingTime = Date.now() - startTime;
      result.policiesChecked = result.promethiosPoliciesChecked + result.enterprisePoliciesChecked;

      return result;

    } catch (error) {
      result.compliant = false;
      result.reason = `Policy enforcement error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.processingTime = Date.now() - startTime;
      return result;
    }
  }

  private async checkPromethiosPolicies(
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<PolicyCheckResult> {
    // Use existing Promethios policy checking logic
    // This maintains compatibility with existing governance patterns
    const policies = Array.from(this.promethiosPolicies.values()).filter(p => p.enabled);
    const violatedPolicies: PolicyDefinition[] = [];
    const warnings: string[] = [];
    const modifications: Record<string, any> = {};

    for (const policy of policies) {
      const policyResult = await this.evaluatePolicy(policy, interaction, context);
      
      if (!policyResult.compliant) {
        violatedPolicies.push(policy);
        if (policyResult.reason) {
          warnings.push(`Promethios Policy '${policy.name}': ${policyResult.reason}`);
        }
      }

      if (policyResult.modifications) {
        Object.assign(modifications, policyResult.modifications);
      }
    }

    return {
      compliant: violatedPolicies.length === 0,
      violatedPolicies,
      warnings,
      modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
      processingTime: 0,
      policiesChecked: policies.length,
      reason: violatedPolicies.length === 0 ? 'All Promethios policies passed' : `${violatedPolicies.length} Promethios policy violation(s)`
    };
  }

  private async checkEnterprisePolicies(
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<PolicyCheckResult> {
    // Get applicable enterprise policies based on context
    const applicablePolicies = this.getApplicableEnterprisePolicies(context);
    const violatedPolicies: PolicyDefinition[] = [];
    const warnings: string[] = [];
    const modifications: Record<string, any> = {};

    for (const policy of applicablePolicies) {
      if (policy.deploymentStatus !== 'deployed') continue;

      for (const rule of policy.rules) {
        const ruleResult = await this.evaluateEnterpriseRule(rule, interaction, context);
        
        if (!ruleResult.compliant) {
          // Convert enterprise policy to PolicyDefinition for compatibility
          const policyDef = this.convertToPolicyDefinition(policy);
          violatedPolicies.push(policyDef);
          warnings.push(`Enterprise Policy '${policy.name}' Rule '${rule.name}': ${ruleResult.reason}`);
        }

        if (ruleResult.modifications) {
          Object.assign(modifications, ruleResult.modifications);
        }
      }
    }

    return {
      compliant: violatedPolicies.length === 0,
      violatedPolicies,
      warnings,
      modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
      processingTime: 0,
      policiesChecked: applicablePolicies.length,
      reason: violatedPolicies.length === 0 ? 'All enterprise policies passed' : `${violatedPolicies.length} enterprise policy violation(s)`
    };
  }

  private getApplicableEnterprisePolicies(context: PolicyEvaluationContext): EnterprisePolicy[] {
    return Array.from(this.enterprisePolicies.values()).filter(policy => {
      // Check organization scope
      if (policy.organizationId && policy.organizationId !== context.organizationId) {
        return false;
      }

      // Check department scope
      if (policy.departmentId && policy.departmentId !== context.departmentId) {
        return false;
      }

      // Check if policy applies to this agent
      const hasAgentScope = policy.rules.some(rule => 
        !rule.agentScope || rule.agentScope.includes(context.agentId)
      );

      // Check if policy applies to this user
      const hasUserScope = policy.rules.some(rule => 
        !rule.userScope || rule.userScope.includes(context.userId)
      );

      return hasAgentScope && hasUserScope;
    });
  }

  private async evaluatePolicy(
    policy: PolicyDefinition,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<{ compliant: boolean; reason?: string; modifications?: any }> {
    // Implement policy evaluation logic
    // This would contain the actual policy evaluation rules
    
    // For now, return a basic evaluation
    return {
      compliant: true,
      reason: 'Policy evaluation not yet implemented'
    };
  }

  private async evaluateEnterpriseRule(
    rule: EnterprisePolicyRule,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<{ compliant: boolean; reason?: string; modifications?: any }> {
    // Evaluate enterprise-specific rule logic
    
    // Check scope restrictions
    if (rule.agentScope && !rule.agentScope.includes(context.agentId)) {
      return { compliant: true, reason: 'Rule not applicable to this agent' };
    }

    if (rule.userScope && !rule.userScope.includes(context.userId)) {
      return { compliant: true, reason: 'Rule not applicable to this user' };
    }

    // Evaluate the rule condition
    const conditionResult = await this.evaluateRuleCondition(rule.condition, interaction, context);
    
    if (!conditionResult.matches) {
      return { compliant: true, reason: 'Rule condition not met' };
    }

    // Apply the rule action
    switch (rule.action) {
      case 'deny':
        return { 
          compliant: false, 
          reason: `Enterprise rule '${rule.name}' denies this action: ${rule.description}` 
        };
      
      case 'allow':
        return { compliant: true };
      
      case 'log':
        // Log the action but allow it
        console.log(`Enterprise policy logged action: ${rule.name}`, { interaction, context });
        return { compliant: true };
      
      case 'alert':
        // Send alert but allow action
        await this.sendPolicyAlert(rule, interaction, context);
        return { compliant: true };
      
      case 'escalate':
        // Escalate for review but allow action for now
        await this.escalatePolicyDecision(rule, interaction, context);
        return { compliant: true };
      
      default:
        return { compliant: true };
    }
  }

  private async evaluateRuleCondition(
    condition: string,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<{ matches: boolean; details?: any }> {
    // Parse and evaluate rule conditions
    // This would implement a rule engine for conditions like:
    // - "trustScore < 0.8"
    // - "interaction.type == 'autonomous'"
    // - "context.userRoles.includes('admin')"
    
    try {
      // Simple condition evaluation (would be more sophisticated in real implementation)
      if (condition.includes('trustScore')) {
        const threshold = parseFloat(condition.split('<')[1]?.trim() || '0');
        return { matches: context.trustScore < threshold };
      }
      
      if (condition.includes('interaction.type')) {
        const expectedType = condition.split('==')[1]?.trim().replace(/['"]/g, '');
        return { matches: interaction.type === expectedType };
      }
      
      // Default to not matching for safety
      return { matches: false };
      
    } catch (error) {
      console.error('Error evaluating rule condition:', error);
      return { matches: false };
    }
  }

  private async detectPolicyConflicts(
    prometheusResult: PolicyCheckResult,
    enterpriseResult: PolicyCheckResult,
    context: PolicyEvaluationContext
  ): Promise<PolicyConflictResolution[]> {
    const conflicts: PolicyConflictResolution[] = [];

    // Detect conflicts between Promethios and enterprise policies
    if (prometheusResult.compliant !== enterpriseResult.compliant) {
      conflicts.push({
        conflictId: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conflictType: 'rule_contradiction',
        policies: [
          ...prometheusResult.violatedPolicies.map(p => p.id),
          ...enterpriseResult.violatedPolicies.map(p => p.id)
        ],
        rules: [], // Would be populated with specific rule IDs
        
        resolution: {
          strategy: this.config.strictMode ? 'enterprise_wins' : 'promethios_wins',
          reasoning: this.config.strictMode 
            ? 'Enterprise policies take precedence in strict mode'
            : 'Promethios policies take precedence by default'
        },
        
        impact: {
          affectedAgents: [context.agentId],
          affectedInteractions: 1,
          riskLevel: 'medium'
        }
      });
    }

    return conflicts;
  }

  private async resolvePolicyConflicts(
    conflicts: PolicyConflictResolution[],
    context: PolicyEvaluationContext
  ): Promise<PolicyConflictResolution[]> {
    const resolvedConflicts: PolicyConflictResolution[] = [];

    for (const conflict of conflicts) {
      const resolved = { ...conflict };
      
      switch (conflict.resolution.strategy) {
        case 'enterprise_wins':
          resolved.resolution.resolvedBy = 'system';
          resolved.resolution.resolvedAt = new Date().toISOString();
          break;
          
        case 'promethios_wins':
          resolved.resolution.resolvedBy = 'system';
          resolved.resolution.resolvedAt = new Date().toISOString();
          break;
          
        case 'manual_review':
          // Would trigger manual review process
          await this.triggerManualReview(conflict, context);
          break;
      }
      
      resolvedConflicts.push(resolved);
    }

    return resolvedConflicts;
  }

  private determineFinalCompliance(
    prometheusResult: PolicyCheckResult,
    enterpriseResult: PolicyCheckResult,
    resolvedConflicts: PolicyConflictResolution[]
  ): PolicyCheckResult {
    // Apply conflict resolutions to determine final compliance
    let finalCompliant = true;
    const finalViolations: PolicyDefinition[] = [];
    const finalWarnings: string[] = [];
    const finalModifications: Record<string, any> = {};

    // Apply conflict resolution strategy
    for (const conflict of resolvedConflicts) {
      switch (conflict.resolution.strategy) {
        case 'enterprise_wins':
          finalCompliant = enterpriseResult.compliant;
          finalViolations.push(...enterpriseResult.violatedPolicies);
          finalWarnings.push(...enterpriseResult.warnings);
          Object.assign(finalModifications, enterpriseResult.modifications || {});
          break;
          
        case 'promethios_wins':
          finalCompliant = prometheusResult.compliant;
          finalViolations.push(...prometheusResult.violatedPolicies);
          finalWarnings.push(...prometheusResult.warnings);
          Object.assign(finalModifications, prometheusResult.modifications || {});
          break;
      }
    }

    // If no conflicts, combine both results
    if (resolvedConflicts.length === 0) {
      finalCompliant = prometheusResult.compliant && enterpriseResult.compliant;
      finalViolations.push(...prometheusResult.violatedPolicies, ...enterpriseResult.violatedPolicies);
      finalWarnings.push(...prometheusResult.warnings, ...enterpriseResult.warnings);
      Object.assign(finalModifications, prometheusResult.modifications || {}, enterpriseResult.modifications || {});
    }

    return {
      compliant: finalCompliant,
      violatedPolicies: finalViolations,
      warnings: finalWarnings,
      modifications: Object.keys(finalModifications).length > 0 ? finalModifications : undefined,
      processingTime: 0,
      policiesChecked: prometheusResult.policiesChecked + enterpriseResult.policiesChecked,
      reason: finalCompliant ? 'All policies passed after conflict resolution' : `Policy violations detected after conflict resolution`
    };
  }

  private async generatePolicyRecommendations(
    result: EnhancedPolicyCheckResult,
    context: PolicyEvaluationContext
  ): Promise<{ suggestedPolicyChanges: string[]; optimizationOpportunities: string[]; complianceImprovements: string[] }> {
    const recommendations = {
      suggestedPolicyChanges: [] as string[],
      optimizationOpportunities: [] as string[],
      complianceImprovements: [] as string[]
    };

    // Generate recommendations based on violations and conflicts
    if (result.conflictsResolved.length > 0) {
      recommendations.suggestedPolicyChanges.push(
        'Consider reviewing policy priorities to reduce conflicts between Promethios and enterprise policies'
      );
    }

    if (result.enterpriseViolations.length > 0) {
      recommendations.complianceImprovements.push(
        'Review enterprise policy rules that are frequently violated and consider adjusting thresholds'
      );
    }

    if (result.processingTime > 1000) {
      recommendations.optimizationOpportunities.push(
        'Policy evaluation is taking longer than optimal - consider caching frequently evaluated rules'
      );
    }

    return recommendations;
  }

  // Helper methods
  private createViolation(
    policy: PolicyDefinition,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): PolicyViolation {
    return {
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      policyId: policy.id,
      agentId: context.agentId,
      userId: context.userId,
      interactionId: interaction.id,
      type: policy.type || 'unknown',
      severity: policy.severity || 'medium',
      description: `Policy violation: ${policy.name}`,
      timestamp: new Date(),
      context: { interaction, context },
      resolved: false
    };
  }

  private convertToPolicyDefinition(policy: EnterprisePolicy): PolicyDefinition {
    return {
      id: policy.policy_id,
      name: policy.name,
      type: policy.category || 'enterprise',
      enabled: policy.deploymentStatus === 'deployed',
      severity: 'medium',
      description: policy.description || ''
    };
  }

  private async sendPolicyAlert(
    rule: EnterprisePolicyRule,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<void> {
    // Implementation would send alerts to appropriate channels
    console.log('Policy alert triggered:', { rule: rule.name, interaction: interaction.id });
  }

  private async escalatePolicyDecision(
    rule: EnterprisePolicyRule,
    interaction: AgentInteraction,
    context: PolicyEvaluationContext
  ): Promise<void> {
    // Implementation would escalate to human reviewers
    console.log('Policy decision escalated:', { rule: rule.name, interaction: interaction.id });
  }

  private async triggerManualReview(
    conflict: PolicyConflictResolution,
    context: PolicyEvaluationContext
  ): Promise<void> {
    // Implementation would trigger manual review process
    console.log('Manual policy review triggered:', { conflict: conflict.conflictId });
  }

  // Public methods for policy management
  async addEnterprisePolicy(policy: EnterprisePolicy): Promise<void> {
    this.enterprisePolicies.set(policy.policy_id, policy);
  }

  async updateEnterprisePolicy(policyId: string, updates: Partial<EnterprisePolicy>): Promise<void> {
    const existing = this.enterprisePolicies.get(policyId);
    if (existing) {
      this.enterprisePolicies.set(policyId, { ...existing, ...updates });
    }
  }

  async removeEnterprisePolicy(policyId: string): Promise<void> {
    this.enterprisePolicies.delete(policyId);
  }

  getEnterprisePolicy(policyId: string): EnterprisePolicy | undefined {
    return this.enterprisePolicies.get(policyId);
  }

  getAllEnterprisePolicies(): EnterprisePolicy[] {
    return Array.from(this.enterprisePolicies.values());
  }
}

/**
 * Policy Extension Class
 * Main extension that integrates with existing governance patterns
 */
export class PolicyExtension extends Extension {
  private static instance: PolicyExtension;
  private trustMetricsExtension: TrustMetricsExtension;
  private auditLogAccessExtension: AuditLogAccessExtension;
  private enhancedPolicyEnforcer: EnhancedPolicyEnforcer;
  private config: EnterprisePolicyConfig;
  private currentUser: User | null = null;

  private constructor() {
    super('PolicyExtension', '1.0.0');
    this.trustMetricsExtension = TrustMetricsExtension.getInstance();
    this.auditLogAccessExtension = AuditLogAccessExtension.getInstance();
    this.config = this.getDefaultConfig();
    this.enhancedPolicyEnforcer = new EnhancedPolicyEnforcer(this.config);
  }

  static getInstance(): PolicyExtension {
    if (!PolicyExtension.instance) {
      PolicyExtension.instance = new PolicyExtension();
    }
    return PolicyExtension.instance;
  }

  private getDefaultConfig(): EnterprisePolicyConfig {
    return {
      enableCustomPolicies: true,
      enablePolicyInheritance: true,
      enablePolicyConflictResolution: true,
      enablePolicyVersioning: true,
      
      complianceFrameworks: ['PROMETHIOS_STANDARD'],
      
      strictMode: false, // Promethios policies take precedence by default
      allowPolicyOverrides: true,
      requireApprovalForNewPolicies: false,
      
      syncWithExistingPolicies: true,
      enableRealTimeValidation: true,
      enablePolicyAnalytics: true
    };
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize dependencies following existing patterns
      await this.trustMetricsExtension.initialize();
      await this.auditLogAccessExtension.initialize();

      // Load existing policies from backend
      await this.loadExistingPolicies();

      this.enable();
      console.log('PolicyExtension initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize PolicyExtension:', error);
      return false;
    }
  }

  /**
   * Set the current user context (following existing pattern)
   */
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    this.auditLogAccessExtension.setCurrentUser(user);
    if (user) {
      userAgentStorageService.setCurrentUser(user.uid);
    }
  }

  /**
   * Main method for checking policy compliance
   * Follows the same pattern as existing governance engine
   */
  async checkPolicyCompliance(
    interaction: AgentInteraction,
    agentId: string
  ): Promise<EnhancedPolicyCheckResult> {
    if (!this.currentUser) {
      throw new Error('User authentication required for policy compliance check');
    }

    // Build evaluation context following existing patterns
    const context: PolicyEvaluationContext = {
      agentId,
      userId: this.currentUser.uid,
      organizationId: this.config.organizationId,
      departmentId: this.config.departmentId,
      interaction,
      
      // Get trust score using existing trust metrics extension
      trustScore: await this.getTrustScore(agentId),
      complianceHistory: await this.getComplianceHistory(agentId),
      currentSession: await this.getCurrentSession(agentId),
      
      // Enterprise context
      userRoles: await this.getUserRoles(this.currentUser.uid),
      departmentPolicies: await this.getDepartmentPolicies(),
      organizationPolicies: await this.getOrganizationPolicies()
    };

    // Use enhanced policy enforcer
    return await this.enhancedPolicyEnforcer.checkCompliance(interaction, context);
  }

  /**
   * Create enterprise policy (integrates with existing UI)
   */
  async createEnterprisePolicy(policyData: Partial<EnterprisePolicy>): Promise<EnterprisePolicy> {
    if (!this.currentUser) {
      throw new Error('User authentication required');
    }

    const policy: EnterprisePolicy = {
      policy_id: `enterprise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: policyData.name || 'New Enterprise Policy',
      version: '1.0.0',
      status: 'draft',
      category: policyData.category,
      description: policyData.description || '',
      rules: policyData.rules || [],
      
      // Enterprise-specific fields
      enterpriseId: `enterprise_${this.currentUser.uid}`,
      organizationId: this.config.organizationId || this.currentUser.uid,
      departmentId: policyData.departmentId,
      
      complianceFrameworks: policyData.complianceFrameworks || this.config.complianceFrameworks,
      
      approvalWorkflow: {
        requiredApprovers: [],
        currentApprovers: [],
        approvalStatus: this.config.requireApprovalForNewPolicies ? 'pending' : 'approved'
      },
      
      deploymentStatus: 'draft',
      
      analytics: {
        totalEvaluations: 0,
        violationCount: 0,
        complianceRate: 1.0
      },
      
      created_at: new Date().toISOString(),
      created_by: this.currentUser.uid,
      metadata: policyData.metadata || {}
    };

    // Add to enforcer
    await this.enhancedPolicyEnforcer.addEnterprisePolicy(policy);

    // Save to backend (integrates with existing policy API)
    await this.savePolicyToBackend(policy);

    // Log policy creation (follows existing audit pattern)
    await this.logPolicyEvent('policy_created', policy);

    return policy;
  }

  /**
   * Update enterprise policy
   */
  async updateEnterprisePolicy(policyId: string, updates: Partial<EnterprisePolicy>): Promise<EnterprisePolicy> {
    if (!this.currentUser) {
      throw new Error('User authentication required');
    }

    const existingPolicy = this.enhancedPolicyEnforcer.getEnterprisePolicy(policyId);
    if (!existingPolicy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const updatedPolicy: EnterprisePolicy = {
      ...existingPolicy,
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: this.currentUser.uid
    };

    // Update in enforcer
    await this.enhancedPolicyEnforcer.updateEnterprisePolicy(policyId, updatedPolicy);

    // Save to backend
    await this.savePolicyToBackend(updatedPolicy);

    // Log policy update
    await this.logPolicyEvent('policy_updated', updatedPolicy);

    return updatedPolicy;
  }

  /**
   * Deploy enterprise policy
   */
  async deployEnterprisePolicy(policyId: string): Promise<void> {
    const policy = this.enhancedPolicyEnforcer.getEnterprisePolicy(policyId);
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }

    if (policy.approvalWorkflow.approvalStatus !== 'approved') {
      throw new Error('Policy must be approved before deployment');
    }

    await this.updateEnterprisePolicy(policyId, {
      deploymentStatus: 'deployed'
    });

    await this.logPolicyEvent('policy_deployed', policy);
  }

  /**
   * Get all enterprise policies for current user
   */
  async getEnterprisePolicies(): Promise<EnterprisePolicy[]> {
    if (!this.currentUser) {
      throw new Error('User authentication required');
    }

    return this.enhancedPolicyEnforcer.getAllEnterprisePolicies()
      .filter(policy => policy.organizationId === this.currentUser!.uid);
  }

  /**
   * Get policy analytics
   */
  async getPolicyAnalytics(policyId?: string): Promise<any> {
    if (!this.currentUser) {
      throw new Error('User authentication required');
    }

    if (policyId) {
      const policy = this.enhancedPolicyEnforcer.getEnterprisePolicy(policyId);
      return policy?.analytics;
    }

    // Return aggregated analytics for all policies
    const policies = await this.getEnterprisePolicies();
    return {
      totalPolicies: policies.length,
      deployedPolicies: policies.filter(p => p.deploymentStatus === 'deployed').length,
      totalEvaluations: policies.reduce((sum, p) => sum + p.analytics.totalEvaluations, 0),
      averageComplianceRate: policies.reduce((sum, p) => sum + p.analytics.complianceRate, 0) / policies.length,
      totalViolations: policies.reduce((sum, p) => sum + p.analytics.violationCount, 0)
    };
  }

  // Helper methods following existing patterns
  private async getTrustScore(agentId: string): Promise<number> {
    try {
      const metrics = await this.trustMetricsExtension.getTrustMetrics(this.currentUser, agentId);
      const agentMetrics = metrics.find(m => m.agentId === agentId);
      return agentMetrics?.trustScores?.aggregate || 0.5;
    } catch (error) {
      console.warn('Could not get trust score, using default:', error);
      return 0.5;
    }
  }

  private async getComplianceHistory(agentId: string): Promise<any[]> {
    // Would integrate with existing audit log system
    return [];
  }

  private async getCurrentSession(agentId: string): Promise<any> {
    // Would get current session data
    return {};
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    // Would get user roles from auth system
    return ['user'];
  }

  private async getDepartmentPolicies(): Promise<string[]> {
    // Would get department-specific policies
    return [];
  }

  private async getOrganizationPolicies(): Promise<string[]> {
    // Would get organization-wide policies
    return [];
  }

  private async loadExistingPolicies(): Promise<void> {
    try {
      // Load Promethios policies from existing API
      const promethiosPolicies = await prometheiosPolicyAPI.getAllPolicies();
      // Would integrate these with the enforcer
      
      // Load enterprise policies from backend
      const enterprisePolicies = await this.loadEnterprisePoliciesFromBackend();
      for (const policy of enterprisePolicies) {
        await this.enhancedPolicyEnforcer.addEnterprisePolicy(policy);
      }
    } catch (error) {
      console.error('Error loading existing policies:', error);
    }
  }

  private async loadEnterprisePoliciesFromBackend(): Promise<EnterprisePolicy[]> {
    // Would load from backend storage
    return [];
  }

  private async savePolicyToBackend(policy: EnterprisePolicy): Promise<void> {
    try {
      // Save to existing policy backend
      await prometheiosPolicyAPI.createPolicy(policy);
    } catch (error) {
      console.error('Error saving policy to backend:', error);
    }
  }

  private async logPolicyEvent(eventType: string, policy: EnterprisePolicy): Promise<void> {
    try {
      // Use existing audit logging pattern
      await this.auditLogAccessExtension.logAuditEvent({
        timestamp: new Date().toISOString(),
        sessionId: `policy_${Date.now()}`,
        userId: this.currentUser?.uid || 'unknown',
        agentId: 'policy_system',
        prompt: `Policy event: ${eventType}`,
        response: `Policy ${policy.name} (${policy.policy_id})`,
        trustScore: 1.0,
        complianceRate: 1.0,
        responseTime: 0,
        sessionIntegrity: 'valid',
        policyViolations: 0,
        toolsUsed: ['policy_management'],
        governanceActions: [eventType],
        emotionalState: { confidence: 1.0 },
        contextualMemory: { policyId: policy.policy_id }
      });
    } catch (error) {
      console.error('Error logging policy event:', error);
    }
  }

  // Configuration methods
  updateConfig(updates: Partial<EnterprisePolicyConfig>): void {
    this.config = { ...this.config, ...updates };
    this.enhancedPolicyEnforcer = new EnhancedPolicyEnforcer(this.config);
  }

  getConfig(): EnterprisePolicyConfig {
    return { ...this.config };
  }

  // Public API for integration with existing UI components
  getEnhancedPolicyEnforcer(): EnhancedPolicyEnforcer {
    return this.enhancedPolicyEnforcer;
  }
}

// Export singleton instance
export const policyExtension = PolicyExtension.getInstance();

