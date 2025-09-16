/**
 * Custom Policy Service
 * 
 * Manages user-defined custom policies that enhance the default HIPAA/SOC2/Legal policies.
 * Integrates with Firebase for persistent storage and real-time updates.
 */

import { unifiedStorage } from './UnifiedStorageService';

export interface CustomPolicy {
  id: string;
  agentId: string;
  userId: string;
  name: string;
  description: string;
  category: 'security' | 'compliance' | 'data_handling' | 'behavior' | 'knowledge' | 'custom';
  rules: PolicyRule[];
  status: 'active' | 'inactive' | 'draft';
  enforcementLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  tags: string[];
  applicableKnowledgeBases?: string[];
  inheritFromDefaults: boolean;
  overrideDefaults: boolean;
}

export interface PolicyRule {
  id: string;
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'log' | 'modify';
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  parameters?: Record<string, any>;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  agentId: string;
  userId: string;
  violationType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  rules: Omit<PolicyRule, 'id'>[];
  tags: string[];
  isPublic: boolean;
}

class CustomPolicyService {
  private readonly COLLECTION_PREFIX = 'custom_policies';
  private readonly VIOLATIONS_PREFIX = 'policy_violations';
  private readonly TEMPLATES_PREFIX = 'policy_templates';

  /**
   * Create a new custom policy
   */
  async createPolicy(userId: string, agentId: string, policyData: Omit<CustomPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<CustomPolicy> {
    try {
      const policyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const policy: CustomPolicy = {
        ...policyData,
        id: policyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      };

      // Store in Firebase under user's custom policies
      const storageKey = `${userId}_${agentId}_${policyId}`;
      await unifiedStorage.setItem(this.COLLECTION_PREFIX, storageKey, policy);

      console.log('✅ Custom policy created:', policy);
      return policy;
    } catch (error) {
      console.error('❌ Failed to create custom policy:', error);
      throw error;
    }
  }

  /**
   * Get all custom policies for an agent
   */
  async getPoliciesForAgent(userId: string, agentId: string): Promise<CustomPolicy[]> {
    try {
      // Get all policies for this user and agent
      const allPolicies = await unifiedStorage.getAllItems(this.COLLECTION_PREFIX);
      
      const agentPolicies = Object.entries(allPolicies)
        .filter(([key, _]) => key.startsWith(`${userId}_${agentId}_`))
        .map(([_, policy]) => policy as CustomPolicy)
        .filter(policy => policy.status === 'active')
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      console.log(`✅ Loaded ${agentPolicies.length} custom policies for agent ${agentId}`);
      return agentPolicies;
    } catch (error) {
      console.error('❌ Failed to load custom policies:', error);
      return [];
    }
  }

  /**
   * Update an existing custom policy
   */
  async updatePolicy(userId: string, agentId: string, policyId: string, updates: Partial<CustomPolicy>): Promise<CustomPolicy> {
    try {
      const storageKey = `${userId}_${agentId}_${policyId}`;
      const existingPolicy = await unifiedStorage.getItem(this.COLLECTION_PREFIX, storageKey) as CustomPolicy;
      
      if (!existingPolicy) {
        throw new Error(`Policy ${policyId} not found`);
      }

      const updatedPolicy: CustomPolicy = {
        ...existingPolicy,
        ...updates,
        id: policyId, // Ensure ID doesn't change
        updatedAt: new Date().toISOString(),
        version: existingPolicy.version + 1
      };

      await unifiedStorage.setItem(this.COLLECTION_PREFIX, storageKey, updatedPolicy);

      console.log('✅ Custom policy updated:', updatedPolicy);
      return updatedPolicy;
    } catch (error) {
      console.error('❌ Failed to update custom policy:', error);
      throw error;
    }
  }

  /**
   * Delete a custom policy
   */
  async deletePolicy(userId: string, agentId: string, policyId: string): Promise<void> {
    try {
      const storageKey = `${userId}_${agentId}_${policyId}`;
      await unifiedStorage.removeItem(this.COLLECTION_PREFIX, storageKey);
      
      console.log('✅ Custom policy deleted:', policyId);
    } catch (error) {
      console.error('❌ Failed to delete custom policy:', error);
      throw error;
    }
  }

  /**
   * Record a policy violation
   */
  async recordViolation(violation: Omit<PolicyViolation, 'id' | 'timestamp'>): Promise<PolicyViolation> {
    try {
      const violationId = `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullViolation: PolicyViolation = {
        ...violation,
        id: violationId,
        timestamp: new Date().toISOString()
      };

      const storageKey = `${violation.userId}_${violation.agentId}_${violationId}`;
      await unifiedStorage.setItem(this.VIOLATIONS_PREFIX, storageKey, fullViolation);

      console.log('⚠️ Policy violation recorded:', fullViolation);
      return fullViolation;
    } catch (error) {
      console.error('❌ Failed to record policy violation:', error);
      throw error;
    }
  }

  /**
   * Get policy violations for an agent
   */
  async getViolationsForAgent(userId: string, agentId: string, limit: number = 50): Promise<PolicyViolation[]> {
    try {
      const allViolations = await unifiedStorage.getAllItems(this.VIOLATIONS_PREFIX);
      
      const agentViolations = Object.entries(allViolations)
        .filter(([key, _]) => key.startsWith(`${userId}_${agentId}_`))
        .map(([_, violation]) => violation as PolicyViolation)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      console.log(`✅ Loaded ${agentViolations.length} violations for agent ${agentId}`);
      return agentViolations;
    } catch (error) {
      console.error('❌ Failed to load policy violations:', error);
      return [];
    }
  }

  /**
   * Get policy templates
   */
  async getPolicyTemplates(): Promise<PolicyTemplate[]> {
    try {
      // Return predefined templates for common use cases
      const templates: PolicyTemplate[] = [
        {
          id: 'template_pii_protection',
          name: 'PII Protection Enhanced',
          description: 'Enhanced personally identifiable information protection beyond HIPAA',
          category: 'data_handling',
          rules: [
            {
              condition: 'content.contains_ssn || content.contains_credit_card',
              action: 'deny',
              message: 'SSN and credit card numbers are strictly prohibited',
              severity: 'critical'
            },
            {
              condition: 'content.contains_email_addresses && !user.has_permission("email_access")',
              action: 'warn',
              message: 'Email addresses detected - ensure proper authorization',
              severity: 'medium'
            }
          ],
          tags: ['pii', 'privacy', 'data-protection'],
          isPublic: true
        },
        {
          id: 'template_financial_compliance',
          name: 'Financial Data Compliance',
          description: 'Compliance rules for financial services and banking data',
          category: 'compliance',
          rules: [
            {
              condition: 'content.contains_financial_data',
              action: 'log',
              message: 'Financial data access logged for audit trail',
              severity: 'high'
            },
            {
              condition: 'action.type === "data_export" && content.category === "financial"',
              action: 'deny',
              message: 'Financial data export requires additional authorization',
              severity: 'critical'
            }
          ],
          tags: ['financial', 'banking', 'audit'],
          isPublic: true
        },
        {
          id: 'template_knowledge_filtering',
          name: 'Knowledge Base Content Filtering',
          description: 'Filter and validate knowledge base content for compliance',
          category: 'knowledge',
          rules: [
            {
              condition: 'document.source === "external" && !document.verified',
              action: 'warn',
              message: 'External document not verified - use with caution',
              severity: 'medium'
            },
            {
              condition: 'document.contains_proprietary_info && user.clearance_level < 3',
              action: 'deny',
              message: 'Insufficient clearance for proprietary information',
              severity: 'high'
            }
          ],
          tags: ['knowledge', 'content-filtering', 'verification'],
          isPublic: true
        },
        {
          id: 'template_behavioral_guidelines',
          name: 'Agent Behavioral Guidelines',
          description: 'Guidelines for agent behavior and response patterns',
          category: 'behavior',
          rules: [
            {
              condition: 'response.contains_medical_advice && !agent.certified_medical',
              action: 'modify',
              message: 'Add medical disclaimer to response',
              severity: 'high',
              parameters: {
                disclaimer: 'This information is for educational purposes only and should not replace professional medical advice.'
              }
            },
            {
              condition: 'response.tone === "aggressive" || response.contains_profanity',
              action: 'deny',
              message: 'Response tone must remain professional and respectful',
              severity: 'high'
            }
          ],
          tags: ['behavior', 'tone', 'professionalism'],
          isPublic: true
        }
      ];

      console.log('✅ Policy templates loaded:', templates.length);
      return templates;
    } catch (error) {
      console.error('❌ Failed to load policy templates:', error);
      return [];
    }
  }

  /**
   * Create policy from template
   */
  async createPolicyFromTemplate(
    userId: string, 
    agentId: string, 
    templateId: string, 
    customizations: Partial<CustomPolicy>
  ): Promise<CustomPolicy> {
    try {
      const templates = await this.getPolicyTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Convert template rules to policy rules with IDs
      const rules: PolicyRule[] = template.rules.map((rule, index) => ({
        ...rule,
        id: `rule_${index + 1}`
      }));

      const policyData: Omit<CustomPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        agentId,
        userId,
        name: customizations.name || template.name,
        description: customizations.description || template.description,
        category: (customizations.category || template.category) as CustomPolicy['category'],
        rules,
        status: 'active',
        enforcementLevel: customizations.enforcementLevel || 'medium',
        createdBy: userId,
        tags: [...template.tags, ...(customizations.tags || [])],
        inheritFromDefaults: customizations.inheritFromDefaults ?? true,
        overrideDefaults: customizations.overrideDefaults ?? false,
        applicableKnowledgeBases: customizations.applicableKnowledgeBases
      };

      return await this.createPolicy(userId, agentId, policyData);
    } catch (error) {
      console.error('❌ Failed to create policy from template:', error);
      throw error;
    }
  }

  /**
   * Validate content against custom policies
   */
  async validateContent(
    userId: string, 
    agentId: string, 
    content: string, 
    context: Record<string, any> = {}
  ): Promise<{
    isValid: boolean;
    violations: PolicyViolation[];
    warnings: string[];
    modifications: string[];
  }> {
    try {
      const policies = await this.getPoliciesForAgent(userId, agentId);
      const violations: PolicyViolation[] = [];
      const warnings: string[] = [];
      const modifications: string[] = [];

      for (const policy of policies) {
        for (const rule of policy.rules) {
          // Simple rule evaluation (in production, use a proper rule engine)
          const ruleResult = this.evaluateRule(rule, content, context);
          
          if (ruleResult.triggered) {
            switch (rule.action) {
              case 'deny':
                const violation = await this.recordViolation({
                  policyId: policy.id,
                  agentId,
                  userId,
                  violationType: 'content_violation',
                  description: rule.message || 'Policy violation detected',
                  severity: rule.severity,
                  context: { content, rule: rule.id, policy: policy.id },
                  resolved: false
                });
                violations.push(violation);
                break;
              case 'warn':
                warnings.push(rule.message || 'Policy warning');
                break;
              case 'modify':
                modifications.push(rule.message || 'Content modification required');
                break;
              case 'log':
                console.log(`📋 Policy log: ${rule.message}`, { policy: policy.id, rule: rule.id });
                break;
            }
          }
        }
      }

      return {
        isValid: violations.length === 0,
        violations,
        warnings,
        modifications
      };
    } catch (error) {
      console.error('❌ Failed to validate content:', error);
      return {
        isValid: false,
        violations: [],
        warnings: ['Policy validation failed'],
        modifications: []
      };
    }
  }

  /**
   * Simple rule evaluation (placeholder for more sophisticated rule engine)
   */
  private evaluateRule(rule: PolicyRule, content: string, context: Record<string, any>): { triggered: boolean; details?: any } {
    try {
      // Simple keyword-based evaluation for demo
      const condition = rule.condition.toLowerCase();
      const contentLower = content.toLowerCase();

      if (condition.includes('contains_ssn')) {
        const ssnPattern = /\b\d{3}-?\d{2}-?\d{4}\b/;
        return { triggered: ssnPattern.test(content) };
      }

      if (condition.includes('contains_email')) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
        return { triggered: emailPattern.test(content) };
      }

      if (condition.includes('contains_credit_card')) {
        const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
        return { triggered: ccPattern.test(content) };
      }

      if (condition.includes('contains_medical_advice')) {
        const medicalKeywords = ['diagnose', 'treatment', 'medication', 'prescription', 'medical condition'];
        return { triggered: medicalKeywords.some(keyword => contentLower.includes(keyword)) };
      }

      if (condition.includes('contains_profanity')) {
        const profanityKeywords = ['damn', 'hell', 'shit', 'fuck']; // Basic list
        return { triggered: profanityKeywords.some(keyword => contentLower.includes(keyword)) };
      }

      // Default: no trigger
      return { triggered: false };
    } catch (error) {
      console.error('❌ Rule evaluation error:', error);
      return { triggered: false };
    }
  }

  /**
   * Get compliance summary for an agent
   */
  async getComplianceSummary(userId: string, agentId: string): Promise<{
    totalPolicies: number;
    activePolicies: number;
    recentViolations: number;
    complianceScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    try {
      const policies = await this.getPoliciesForAgent(userId, agentId);
      const violations = await this.getViolationsForAgent(userId, agentId, 100);
      
      const activePolicies = policies.filter(p => p.status === 'active').length;
      const recentViolations = violations.filter(v => 
        new Date(v.timestamp).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
      ).length;

      // Calculate compliance score based on violations and policy coverage
      let complianceScore = 100;
      if (recentViolations > 0) {
        complianceScore -= Math.min(recentViolations * 5, 30); // Max 30 point deduction
      }

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (recentViolations > 10 || complianceScore < 60) {
        riskLevel = 'critical';
      } else if (recentViolations > 5 || complianceScore < 80) {
        riskLevel = 'high';
      } else if (recentViolations > 2 || complianceScore < 90) {
        riskLevel = 'medium';
      }

      return {
        totalPolicies: policies.length,
        activePolicies,
        recentViolations,
        complianceScore,
        riskLevel
      };
    } catch (error) {
      console.error('❌ Failed to get compliance summary:', error);
      return {
        totalPolicies: 0,
        activePolicies: 0,
        recentViolations: 0,
        complianceScore: 0,
        riskLevel: 'critical'
      };
    }
  }
}

export const customPolicyService = new CustomPolicyService();
export default customPolicyService;

