/**
 * Unified Policy Registry
 * 
 * Single source of truth for all policies in Promethios.
 * Contains real policy content with actual rules, conditions, and legal basis.
 * Replaces fake policy strings with enforceable policy definitions.
 * 
 * @author Manus AI
 * @version 1.0.0
 */

// Core Policy Interfaces
export interface PolicyRule {
  rule_id: string;
  name: string;
  description: string;
  condition: string; // Logical condition to evaluate
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate' | 'redact' | 'encrypt';
  priority: number; // Higher number = higher priority
  parameters?: Record<string, any>;
  legalBasis?: string; // Legal citation or basis
  violationMessage: string; // Message to show when rule is violated
  complianceMessage: string; // Message to show when rule is followed
}

export interface PolicyContent {
  policy_id: string;
  name: string;
  version: string;
  status: 'active' | 'draft' | 'deprecated' | 'archived';
  category: 'compliance' | 'security' | 'privacy' | 'operational' | 'custom';
  description: string;
  legalFramework: string; // The legal framework this policy implements
  jurisdiction: string[]; // Where this policy applies
  rules: PolicyRule[];
  
  // For agent recitation and explanation
  summary: string; // Brief summary for agents to recite
  purpose: string; // Why this policy exists
  scope: string; // What this policy covers
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  compliance_mappings: {
    [standard: string]: string[]; // Maps to specific compliance requirements
  };
  
  // Policy relationships
  conflicts_with?: string[]; // Policy IDs that conflict with this one
  requires?: string[]; // Policy IDs that must be active with this one
  supersedes?: string[]; // Policy IDs that this policy replaces
}

export interface PolicyRegistry {
  // Core registry operations
  getPolicy(policyId: string): PolicyContent | null;
  getAllPolicies(): PolicyContent[];
  getPoliciesByCategory(category: string): PolicyContent[];
  getActivePolicies(): PolicyContent[];
  
  // Policy relationships
  checkPolicyConflicts(policyIds: string[]): PolicyConflict[];
  resolvePolicyHierarchy(policyIds: string[]): PolicyResolution;
  
  // Policy evaluation
  evaluateRules(policyId: string, context: PolicyEvaluationContext): PolicyEvaluationResult[];
  
  // Agent integration
  getPolicyExplanation(policyId: string, ruleId?: string): string;
  getPolicyRecitation(policyId: string): string;
}

export interface PolicyConflict {
  policy_id_1: string;
  policy_id_2: string;
  rule_id_1?: string;
  rule_id_2?: string;
  conflict_type: 'contradiction' | 'redundancy' | 'priority_conflict' | 'scope_overlap';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolution_suggestion: string;
}

export interface PolicyResolution {
  resolved_policies: string[];
  applied_rules: PolicyRule[];
  conflicts_resolved: PolicyConflict[];
  warnings: string[];
}

export interface PolicyEvaluationContext {
  agent_id: string;
  user_id?: string;
  interaction_type: string;
  data_types: string[];
  content?: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface PolicyEvaluationResult {
  rule_id: string;
  policy_id: string;
  matched: boolean;
  action: string;
  confidence: number;
  explanation: string;
  metadata?: Record<string, any>;
}

// Standard Policy Definitions with Real Content
import { COMPREHENSIVE_POLICIES } from './ComprehensiveCompliancePolicies';

const STANDARD_POLICIES: PolicyContent[] = [
  ...COMPREHENSIVE_POLICIES,
  // Keep the custom policy template
  {
    policy_id: 'custom_policy_template_v1',
    name: 'Custom Policy Template',
    version: '1.0.0',
    status: 'active',
    category: 'custom',
    description: 'Template for creating custom organizational policies',
    legalFramework: 'Organization-specific requirements',
    jurisdiction: ['Global'],
    summary: 'Flexible template for creating custom policies tailored to specific organizational needs',
    purpose: 'Provide a foundation for custom policy creation',
    scope: 'Configurable based on organizational requirements',
    
    rules: [
      {
        rule_id: 'custom_content_filter',
        name: 'Custom Content Filter',
        description: 'Filter content based on custom criteria',
        condition: 'custom_condition_placeholder',
        action: 'alert',
        priority: 50,
        legalBasis: 'Organization policy',
        violationMessage: 'Content violates organizational policy. Please review and modify.',
        complianceMessage: 'Content complies with organizational policy.',
        parameters: {
          configurable: true,
          custom_patterns: [],
          custom_actions: ['allow', 'deny', 'log', 'alert', 'escalate']
        }
      },
      {
        rule_id: 'custom_access_control',
        name: 'Custom Access Control',
        description: 'Control access based on custom rules',
        condition: 'custom_access_condition_placeholder',
        action: 'log',
        priority: 60,
        legalBasis: 'Organization access policy',
        violationMessage: 'Access denied based on organizational access policy.',
        complianceMessage: 'Access granted according to organizational policy.',
        parameters: {
          configurable: true,
          role_based: true,
          time_based: false,
          location_based: false
        }
      },
      {
        rule_id: 'custom_audit_requirement',
        name: 'Custom Audit Requirement',
        description: 'Custom audit and logging requirements',
        condition: 'custom_audit_condition_placeholder',
        action: 'log',
        priority: 40,
        legalBasis: 'Organization audit policy',
        violationMessage: 'Action requires audit logging per organizational policy.',
        complianceMessage: 'Action properly logged according to organizational audit requirements.',
        parameters: {
          configurable: true,
          log_level: 'standard',
          retention_period: '1_year',
          include_metadata: true
        }
      }
    ],
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: 'system',
    compliance_mappings: {
      'Custom': ['Organization_Policy_1', 'Organization_Policy_2']
    }
  }
];

/**
 * Unified Policy Registry Implementation
 */
export class UnifiedPolicyRegistry implements PolicyRegistry {
  private static instance: UnifiedPolicyRegistry;
  private policies: Map<string, PolicyContent> = new Map();
  
  private constructor() {
    // Load standard policies
    STANDARD_POLICIES.forEach(policy => {
      this.policies.set(policy.policy_id, policy);
    });
  }

  public static getInstance(): UnifiedPolicyRegistry {
    if (!UnifiedPolicyRegistry.instance) {
      UnifiedPolicyRegistry.instance = new UnifiedPolicyRegistry();
    }
    return UnifiedPolicyRegistry.instance;
  }
  
  getPolicy(policyId: string): PolicyContent | null {
    return this.policies.get(policyId) || null;
  }
  
  getAllPolicies(): PolicyContent[] {
    return Array.from(this.policies.values());
  }
  
  getPoliciesByCategory(category: string): PolicyContent[] {
    return Array.from(this.policies.values()).filter(
      policy => policy.category === category
    );
  }
  
  getActivePolicies(): PolicyContent[] {
    return Array.from(this.policies.values()).filter(
      policy => policy.status === 'active'
    );
  }
  
  checkPolicyConflicts(policyIds: string[]): PolicyConflict[] {
    const conflicts: PolicyConflict[] = [];
    const policies = policyIds.map(id => this.getPolicy(id)).filter(Boolean) as PolicyContent[];
    
    // Check for conflicts between policies
    for (let i = 0; i < policies.length; i++) {
      for (let j = i + 1; j < policies.length; j++) {
        const policy1 = policies[i];
        const policy2 = policies[j];
        
        // Check if policies explicitly conflict
        if (policy1.conflicts_with?.includes(policy2.policy_id)) {
          conflicts.push({
            policy_id_1: policy1.policy_id,
            policy_id_2: policy2.policy_id,
            conflict_type: 'contradiction',
            description: `${policy1.name} explicitly conflicts with ${policy2.name}`,
            severity: 'high',
            resolution_suggestion: 'Choose one policy or create a custom resolution'
          });
        }
        
        // Check for rule-level conflicts
        for (const rule1 of policy1.rules) {
          for (const rule2 of policy2.rules) {
            if (rule1.condition === rule2.condition && rule1.action !== rule2.action) {
              conflicts.push({
                policy_id_1: policy1.policy_id,
                policy_id_2: policy2.policy_id,
                rule_id_1: rule1.rule_id,
                rule_id_2: rule2.rule_id,
                conflict_type: 'contradiction',
                description: `Rules have same condition but different actions: ${rule1.action} vs ${rule2.action}`,
                severity: 'medium',
                resolution_suggestion: 'Use rule with higher priority or create custom resolution'
              });
            }
          }
        }
      }
    }
    
    return conflicts;
  }
  
  resolvePolicyHierarchy(policyIds: string[]): PolicyResolution {
    const policies = policyIds.map(id => this.getPolicy(id)).filter(Boolean) as PolicyContent[];
    const conflicts = this.checkPolicyConflicts(policyIds);
    
    // Collect all rules and sort by priority
    const allRules: PolicyRule[] = [];
    policies.forEach(policy => {
      policy.rules.forEach(rule => {
        allRules.push(rule);
      });
    });
    
    // Sort by priority (higher number = higher priority)
    allRules.sort((a, b) => b.priority - a.priority);
    
    return {
      resolved_policies: policyIds,
      applied_rules: allRules,
      conflicts_resolved: conflicts,
      warnings: conflicts.length > 0 ? ['Policy conflicts detected - using priority-based resolution'] : []
    };
  }
  
  evaluateRules(policyId: string, context: PolicyEvaluationContext): PolicyEvaluationResult[] {
    const policy = this.getPolicy(policyId);
    if (!policy) return [];
    
    const results: PolicyEvaluationResult[] = [];
    
    for (const rule of policy.rules) {
      // Simple condition evaluation (in real implementation, use proper expression evaluator)
      const matched = this.evaluateCondition(rule.condition, context);
      
      results.push({
        rule_id: rule.rule_id,
        policy_id: policyId,
        matched,
        action: rule.action,
        confidence: matched ? 0.95 : 0.05,
        explanation: matched ? rule.violationMessage : rule.complianceMessage,
        metadata: {
          legal_basis: rule.legalBasis,
          priority: rule.priority
        }
      });
    }
    
    return results;
  }
  
  getPolicyExplanation(policyId: string, ruleId?: string): string {
    const policy = this.getPolicy(policyId);
    if (!policy) return 'Policy not found';
    
    if (ruleId) {
      const rule = policy.rules.find(r => r.rule_id === ruleId);
      if (rule) {
        return `${rule.name}: ${rule.description}. Legal basis: ${rule.legalBasis}`;
      }
    }
    
    return `${policy.name}: ${policy.description}. This policy implements ${policy.legalFramework} requirements.`;
  }
  
  getPolicyRecitation(policyId: string): string {
    const policy = this.getPolicy(policyId);
    if (!policy) return 'Policy not found';
    
    return `I am governed by the ${policy.name}, which ${policy.purpose.toLowerCase()}. ` +
           `This policy covers ${policy.scope.toLowerCase()} and implements ${policy.legalFramework} requirements. ` +
           `Key protections include: ${policy.rules.map(r => r.name).join(', ')}.`;
  }
  
  private evaluateCondition(condition: string, context: PolicyEvaluationContext): boolean {
    // Simplified condition evaluation - in real implementation, use proper expression evaluator
    // This is a placeholder for demonstration
    
    if (condition.includes('contains_phi')) {
      return context.data_types.includes('healthcare') || 
             (context.content && /\b\d{3}-\d{2}-\d{4}\b/.test(context.content)); // SSN pattern
    }
    
    if (condition.includes('contains_personal_data')) {
      return context.data_types.includes('personal') ||
             (context.content && /@/.test(context.content)); // Email pattern
    }
    
    if (condition.includes('data_types.includes("financial")')) {
      return context.data_types.includes('financial');
    }
    
    if (condition.includes('interaction_type')) {
      const match = condition.match(/interaction_type\s*==\s*"([^"]+)"/);
      if (match) {
        return context.interaction_type === match[1];
      }
    }
    
    return false;
  }
  
  // Registry management methods
  addPolicy(policy: PolicyContent): void {
    this.policies.set(policy.policy_id, policy);
  }
  
  updatePolicy(policyId: string, updates: Partial<PolicyContent>): boolean {
    const existing = this.policies.get(policyId);
    if (!existing) return false;
    
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.policies.set(policyId, updated);
    return true;
  }
  
  removePolicy(policyId: string): boolean {
    return this.policies.delete(policyId);
  }
}

// Singleton instance
export const unifiedPolicyRegistry = new UnifiedPolicyRegistry();

// Export standard policy IDs for easy reference
export const STANDARD_POLICY_IDS = {
  HIPAA: 'hipaa_comprehensive_v1',
  SOX: 'sox_comprehensive_v1',
  GDPR: 'gdpr_comprehensive_v1',
  CUSTOM: 'custom_policy_template_v1'
} as const;

// Export for backward compatibility with existing code
export const POLICY_TEMPLATES_REAL = [
  {
    id: STANDARD_POLICY_IDS.HIPAA,
    name: 'HIPAA Compliance',
    description: 'Healthcare data protection',
    icon: '🏥',
    requirements: ['Data encryption', 'Access logging', 'Audit trails']
  },
  {
    id: STANDARD_POLICY_IDS.SOX,
    name: 'SOX Compliance', 
    description: 'Financial reporting controls',
    icon: '💰',
    requirements: ['Financial controls', 'Change management', 'Documentation']
  },
  {
    id: STANDARD_POLICY_IDS.GDPR,
    name: 'GDPR Compliance',
    description: 'EU data protection',
    icon: '🇪🇺', 
    requirements: ['Data minimization', 'Consent management', 'Right to deletion']
  },
  {
    id: STANDARD_POLICY_IDS.CUSTOM,
    name: 'Custom Policy',
    description: 'Define your own rules',
    icon: '⚙️',
    requirements: ['Custom rules', 'Flexible configuration']
  }
];

