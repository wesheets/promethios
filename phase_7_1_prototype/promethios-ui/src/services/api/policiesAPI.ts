/**
 * Policies API Service
 * 
 * Production-ready API service for policy management with comprehensive
 * CRUD operations, validation, and monitoring integration.
 */

import { apiClient } from './apiClient';

export interface PolicyRule {
  id: string;
  name: string;
  type: 'trust_threshold' | 'content_filter' | 'rate_limit' | 'data_retention' | 'audit_requirement' | 'pii_protection' | 'response_validation';
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'escalate' | 'log' | 'throttle';
  parameters: Record<string, any>;
  enabled: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'healthcare' | 'legal' | 'general' | 'custom' | 'security' | 'compliance';
  compliance_level: 'lenient' | 'standard' | 'strict' | 'enterprise';
  rules: PolicyRule[];
  tags: string[];
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  effectiveness_score: number;
}

export interface AgentPolicyAssignment {
  id: string;
  agent_id: string;
  agent_name: string;
  agent_type: 'single' | 'multi';
  policy_ids: string[];
  compliance_status: 'compliant' | 'warning' | 'violation' | 'unknown';
  last_evaluation: string;
  trust_score: number;
  violation_count: number;
  last_violation: string | null;
  enforcement_mode: 'monitor' | 'enforce' | 'strict';
  custom_rules: PolicyRule[];
}

export interface PolicyViolation {
  id: string;
  policy_id: string;
  policy_name: string;
  rule_id: string;
  rule_name: string;
  agent_id: string;
  agent_name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  context: Record<string, any>;
  occurred_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  impact_score: number;
}

export interface PolicyAnalytics {
  total_policies: number;
  active_policies: number;
  total_assignments: number;
  compliance_rate: number;
  violation_trend: 'increasing' | 'decreasing' | 'stable';
  most_violated_policy: string;
  most_effective_policy: string;
  avg_effectiveness_score: number;
  policy_coverage: number;
}

export interface CreatePolicyRequest {
  name: string;
  description: string;
  category: PolicyTemplate['category'];
  compliance_level: PolicyTemplate['compliance_level'];
  rules: Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>[];
  tags: string[];
}

export interface UpdatePolicyRequest extends Partial<CreatePolicyRequest> {
  id: string;
  version?: string;
}

export interface AssignPolicyRequest {
  agent_id: string;
  policy_ids: string[];
  enforcement_mode: AgentPolicyAssignment['enforcement_mode'];
  custom_rules?: Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>[];
}

class PoliciesAPIService {
  private baseUrl = '/api/policies';

  // Policy Template Management
  async getPolicyTemplates(): Promise<PolicyTemplate[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/templates`);
      return response.data;
    } catch (error) {
      console.error('Error fetching policy templates:', error);
      throw new Error('Failed to fetch policy templates');
    }
  }

  async getPolicyTemplate(id: string): Promise<PolicyTemplate> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/templates/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching policy template:', error);
      throw new Error('Failed to fetch policy template');
    }
  }

  async createPolicyTemplate(policy: CreatePolicyRequest): Promise<PolicyTemplate> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/templates`, policy);
      return response.data;
    } catch (error) {
      console.error('Error creating policy template:', error);
      throw new Error('Failed to create policy template');
    }
  }

  async updatePolicyTemplate(policy: UpdatePolicyRequest): Promise<PolicyTemplate> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/templates/${policy.id}`, policy);
      return response.data;
    } catch (error) {
      console.error('Error updating policy template:', error);
      throw new Error('Failed to update policy template');
    }
  }

  async deletePolicyTemplate(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/templates/${id}`);
    } catch (error) {
      console.error('Error deleting policy template:', error);
      throw new Error('Failed to delete policy template');
    }
  }

  async duplicatePolicyTemplate(id: string, name: string): Promise<PolicyTemplate> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/templates/${id}/duplicate`, { name });
      return response.data;
    } catch (error) {
      console.error('Error duplicating policy template:', error);
      throw new Error('Failed to duplicate policy template');
    }
  }

  // Agent Policy Assignments
  async getAgentPolicyAssignments(): Promise<AgentPolicyAssignment[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/assignments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent policy assignments:', error);
      throw new Error('Failed to fetch agent policy assignments');
    }
  }

  async getAgentPolicyAssignment(agentId: string): Promise<AgentPolicyAssignment> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/assignments/agent/${agentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching agent policy assignment:', error);
      throw new Error('Failed to fetch agent policy assignment');
    }
  }

  async assignPolicyToAgent(assignment: AssignPolicyRequest): Promise<AgentPolicyAssignment> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/assignments`, assignment);
      return response.data;
    } catch (error) {
      console.error('Error assigning policy to agent:', error);
      throw new Error('Failed to assign policy to agent');
    }
  }

  async updateAgentPolicyAssignment(agentId: string, assignment: Partial<AssignPolicyRequest>): Promise<AgentPolicyAssignment> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/assignments/agent/${agentId}`, assignment);
      return response.data;
    } catch (error) {
      console.error('Error updating agent policy assignment:', error);
      throw new Error('Failed to update agent policy assignment');
    }
  }

  async removeAgentPolicyAssignment(agentId: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/assignments/agent/${agentId}`);
    } catch (error) {
      console.error('Error removing agent policy assignment:', error);
      throw new Error('Failed to remove agent policy assignment');
    }
  }

  // Policy Violations
  async getPolicyViolations(filters?: {
    policy_id?: string;
    agent_id?: string;
    severity?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PolicyViolation[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      const response = await apiClient.get(`${this.baseUrl}/violations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching policy violations:', error);
      throw new Error('Failed to fetch policy violations');
    }
  }

  async resolvePolicyViolation(violationId: string, resolutionNotes: string): Promise<PolicyViolation> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/violations/${violationId}/resolve`, {
        resolution_notes: resolutionNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error resolving policy violation:', error);
      throw new Error('Failed to resolve policy violation');
    }
  }

  // Policy Analytics
  async getPolicyAnalytics(): Promise<PolicyAnalytics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching policy analytics:', error);
      throw new Error('Failed to fetch policy analytics');
    }
  }

  // Policy Testing & Validation
  async testPolicyRule(rule: Omit<PolicyRule, 'id' | 'created_at' | 'updated_at'>, testInput: any): Promise<{
    result: 'allow' | 'deny' | 'warn' | 'escalate';
    explanation: string;
    confidence: number;
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/test-rule`, {
        rule,
        test_input: testInput
      });
      return response.data;
    } catch (error) {
      console.error('Error testing policy rule:', error);
      throw new Error('Failed to test policy rule');
    }
  }

  async validatePolicyTemplate(policy: CreatePolicyRequest): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
  }> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/validate`, policy);
      return response.data;
    } catch (error) {
      console.error('Error validating policy template:', error);
      throw new Error('Failed to validate policy template');
    }
  }

  // Policy Import/Export
  async exportPolicyTemplate(id: string, format: 'json' | 'yaml' | 'xml'): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/templates/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting policy template:', error);
      throw new Error('Failed to export policy template');
    }
  }

  async importPolicyTemplate(file: File): Promise<PolicyTemplate> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`${this.baseUrl}/templates/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error importing policy template:', error);
      throw new Error('Failed to import policy template');
    }
  }
}

export const policiesAPI = new PoliciesAPIService();

