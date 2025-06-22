/**
 * Policy Backend Service
 * 
 * Service layer for communicating with the policy management backend APIs.
 * Handles policy CRUD operations, enforcement, and compliance monitoring.
 */

import { API_BASE_URL } from '../config/api';

export interface PolicyRule {
  id: string;
  name: string;
  type: 'trust_threshold' | 'content_filter' | 'rate_limit' | 'data_retention' | 'audit_requirement';
  condition: string;
  action: 'allow' | 'deny' | 'warn' | 'escalate';
  parameters: Record<string, any>;
  enabled: boolean;
}

export interface PolicyTemplate {
  id: string;
  name: string;
  category: 'financial' | 'healthcare' | 'legal' | 'general' | 'custom';
  description: string;
  rules: PolicyRule[];
  compliance_level: 'lenient' | 'standard' | 'strict';
  created_at?: string;
  updated_at?: string;
}

export interface PolicyEnforceRequest {
  agent_id: string;
  task_id: string;
  action_type: string;
  action_details: Record<string, any>;
  context: Record<string, any>;
  timestamp?: string;
}

export interface PolicyEnforceResponse {
  policy_decision_id: string;
  action: 'allow' | 'deny' | 'modify' | 'log';
  reason: string;
  modifications?: Record<string, any>;
  timestamp: string;
}

export interface PolicyDecision {
  policy_decision_id: string;
  agent_id: string;
  task_id: string;
  action_type: string;
  action_details: Record<string, any>;
  context: Record<string, any>;
  action: string;
  reason: string;
  modifications?: Record<string, any>;
  timestamp: string;
}

export interface PolicyStatistics {
  total_policies: number;
  active_policies: number;
  total_decisions: number;
  decisions_by_action: {
    allow: number;
    deny: number;
    modify: number;
    log: number;
  };
  compliance_score: number;
  recent_violations: number;
}

export interface PolicyQueryRequest {
  agent_id?: string;
  action_type?: string;
  decision?: string;
  start_time?: string;
  end_time?: string;
  limit?: number;
}

export interface PolicyQueryResponse {
  decisions: PolicyDecision[];
  total: number;
  page: number;
  limit: number;
}

class PolicyBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/policy`;
  }

  /**
   * Get policy statistics and overview metrics
   */
  async getStatistics(): Promise<PolicyStatistics> {
    try {
      const response = await fetch(`${this.baseUrl}/statistics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Handle backend response format
      if (data.success === false) {
        console.warn('Policy statistics not available:', data.error);
        // Return default statistics
        return {
          total_policies: 0,
          active_policies: 0,
          total_decisions: 0,
          decisions_by_action: {
            allow: 0,
            deny: 0,
            modify: 0,
            log: 0
          },
          compliance_score: 0,
          recent_violations: 0
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching policy statistics:', error);
      // Return default statistics on error
      return {
        total_policies: 0,
        active_policies: 0,
        total_decisions: 0,
        decisions_by_action: {
          allow: 0,
          deny: 0,
          modify: 0,
          log: 0
        },
        compliance_score: 0,
        recent_violations: 0
      };
    }
  }

  /**
   * List all policy templates
   */
  async listPolicies(): Promise<PolicyTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/policies`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.policies || [];
    } catch (error) {
      console.error('Error fetching policies:', error);
      return [];
    }
  }

  /**
   * Create a new policy template
   */
  async createPolicy(policy: Omit<PolicyTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<PolicyTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/policies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.policy;
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Update an existing policy template
   */
  async updatePolicy(policyId: string, policy: Partial<PolicyTemplate>): Promise<PolicyTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/policies/${policyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policy),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.policy;
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  /**
   * Delete a policy template
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/policies/${policyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  /**
   * Enforce policy for a specific agent action
   */
  async enforcePolicy(request: PolicyEnforceRequest): Promise<PolicyEnforceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/enforce`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error enforcing policy:', error);
      throw error;
    }
  }

  /**
   * Query policy decisions with filters
   */
  async queryDecisions(request: PolicyQueryRequest): Promise<PolicyQueryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (request.agent_id) params.append('agent_id', request.agent_id);
      if (request.action_type) params.append('action_type', request.action_type);
      if (request.decision) params.append('decision', request.decision);
      if (request.start_time) params.append('start_time', request.start_time);
      if (request.end_time) params.append('end_time', request.end_time);
      if (request.limit) params.append('limit', request.limit.toString());
      
      const response = await fetch(`${this.baseUrl}/query?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error querying policy decisions:', error);
      return {
        decisions: [],
        total: 0,
        page: 1,
        limit: request.limit || 100
      };
    }
  }

  /**
   * Get a specific policy decision by ID
   */
  async getDecision(decisionId: string): Promise<PolicyDecision | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${decisionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching policy decision:', error);
      return null;
    }
  }
}

export const policyBackendService = new PolicyBackendService();
export default policyBackendService;

