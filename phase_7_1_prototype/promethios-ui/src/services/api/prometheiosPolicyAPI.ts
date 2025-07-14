/**
 * Promethios Policy API Service
 * Integrates with existing PolicyManagementModule and provides enhanced features
 */

import { useAuth } from '../../hooks/use-auth';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://promethios-phase-7-1-api.onrender.com';
const PROMETHIOS_POLICY_ENDPOINT = `${API_BASE_URL}/api/promethios-policy`;

// Promethios Policy Schema Interfaces (matching existing schema)
export interface PrometheiosPolicyRule {
  rule_id: string;
  name?: string;
  description?: string;
  condition: string;
  action: 'allow' | 'deny' | 'log' | 'alert' | 'escalate';
  priority?: number;
  metadata?: {
    rationale?: string;
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface PrometheiosPolicy {
  policy_id: string;
  name: string;
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  category?: string;
  description?: string;
  rules: PrometheiosPolicyRule[];
  metadata?: {
    owner?: string;
    compliance_mappings?: {
      [standard: string]: string[];
    };
    tags?: string[];
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

// Enhanced features interfaces
export interface PolicyAnalytics {
  effectiveness_score: number;
  compliance_rate: number;
  violation_count: number;
  total_evaluations: number;
  avg_trust_score: number;
  trend_data: Array<{
    date: string;
    compliance_rate: number;
    violation_count: number;
    total_evaluations: number;
  }>;
}

export interface PolicyOptimization {
  suggestions: Array<{
    type: 'rule_modification' | 'rule_addition' | 'rule_removal' | 'priority_adjustment';
    description: string;
    impact_score: number;
    confidence: number;
  }>;
  predicted_improvement: number;
  risk_assessment: 'low' | 'medium' | 'high';
}

export interface PolicyConflict {
  rule_id_1: string;
  rule_id_2: string;
  conflict_type: 'contradiction' | 'redundancy' | 'priority_conflict';
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution_suggestion: string;
}

export interface NLPolicyRequest {
  description: string;
  policy_type: string;
  compliance_requirements: string[];
  context: string;
}

export interface PolicyTestRequest {
  policy: PrometheiosPolicy;
  test_scenarios: Array<{
    input: string;
    expected_action: string;
  }>;
}

export interface PolicyTestResult {
  results: Array<{
    scenario: string;
    expected: string;
    actual: string;
    passed: boolean;
    explanation?: string;
  }>;
  overall_passed: boolean;
  passed_count: number;
  total_count: number;
}

// API Helper Functions
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

// Core Policy Management (integrating with existing PolicyManagementModule)
export const prometheiosPolicyAPI = {
  // Basic CRUD operations
  async listPolicies(filters?: {
    status?: string;
    policy_type?: string;
    category?: string;
    tags?: string[];
  }): Promise<PrometheiosPolicy[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.policy_type) params.append('policy_type', filters.policy_type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }

    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async getPolicy(policyId: string): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async createPolicy(policy: Omit<PrometheiosPolicy, 'policy_id' | 'created_at' | 'updated_at'>): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(policy),
    });

    return handleResponse(response);
  },

  async updatePolicy(policyId: string, updates: Partial<PrometheiosPolicy>): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return handleResponse(response);
  },

  async deletePolicy(policyId: string): Promise<void> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    await handleResponse(response);
  },

  // Enhanced Features - Natural Language Generation
  async generateFromNL(request: NLPolicyRequest): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/generate-from-nl`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Testing
  async testPolicy(request: PolicyTestRequest): Promise<PolicyTestResult> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Analytics
  async getPolicyAnalytics(policyId: string): Promise<PolicyAnalytics> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/analytics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Optimization
  async optimizePolicy(policyId: string): Promise<PolicyOptimization> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/optimize`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Conflict Detection
  async detectConflicts(policyId: string): Promise<PolicyConflict[]> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/conflicts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Simulation
  async simulatePolicy(policyId: string, scenarios: Array<{
    input: any;
    context?: any;
  }>): Promise<Array<{
    input: any;
    result: {
      action: string;
      confidence: number;
      explanation: string;
      triggered_rules: string[];
    };
  }>> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/simulate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenarios }),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Templates
  async getPolicyTemplates(category?: string): Promise<Array<{
    template_id: string;
    name: string;
    description: string;
    category: string;
    compliance_standards: string[];
    template_policy: Partial<PrometheiosPolicy>;
    usage_count: number;
    rating: number;
  }>> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/templates?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async createPolicyFromTemplate(templateId: string, customizations?: Partial<PrometheiosPolicy>): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/templates/${templateId}/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(customizations || {}),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Validation
  async validatePolicy(policy: PrometheiosPolicy): Promise<{
    valid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    suggestions: Array<{
      type: string;
      message: string;
      auto_fix_available: boolean;
    }>;
  }> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/validate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ policy }),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Deployment
  async deployPolicy(policyId: string, deploymentConfig: {
    target_agents?: string[];
    enforcement_mode: 'monitor' | 'enforce' | 'strict';
    rollout_strategy: 'immediate' | 'gradual' | 'canary';
    rollback_threshold?: number;
  }): Promise<{
    deployment_id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    deployed_agents: string[];
    failed_agents: string[];
    rollback_available: boolean;
  }> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/deploy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(deploymentConfig),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Monitoring
  async getPolicyMetrics(policyId: string, timeRange?: {
    start: string;
    end: string;
  }): Promise<{
    enforcement_count: number;
    violation_count: number;
    compliance_rate: number;
    performance_impact: {
      avg_latency_ms: number;
      throughput_impact: number;
    };
    agent_coverage: {
      total_agents: number;
      deployed_agents: number;
      active_agents: number;
    };
    trend_data: Array<{
      timestamp: string;
      enforcement_count: number;
      violation_count: number;
      compliance_rate: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (timeRange?.start) params.append('start', timeRange.start);
    if (timeRange?.end) params.append('end', timeRange.end);

    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/metrics?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Compliance Reporting
  async generateComplianceReport(policyIds: string[], reportConfig: {
    format: 'pdf' | 'json' | 'csv';
    include_violations: boolean;
    include_trends: boolean;
    time_range: {
      start: string;
      end: string;
    };
  }): Promise<{
    report_id: string;
    download_url: string;
    expires_at: string;
  }> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/compliance/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        policy_ids: policyIds,
        ...reportConfig,
      }),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Versioning
  async getPolicyVersions(policyId: string): Promise<Array<{
    version: string;
    created_at: string;
    created_by: string;
    changes: Array<{
      field: string;
      old_value: any;
      new_value: any;
    }>;
    is_current: boolean;
  }>> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/versions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async revertPolicyVersion(policyId: string, version: string): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/versions/${version}/revert`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Collaboration
  async sharePolicyForReview(policyId: string, reviewers: string[], message?: string): Promise<{
    review_id: string;
    review_url: string;
    expires_at: string;
  }> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/share`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reviewers,
        message,
      }),
    });

    return handleResponse(response);
  },

  async getPolicyReviews(policyId: string): Promise<Array<{
    review_id: string;
    reviewer: string;
    status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
    comments: Array<{
      field: string;
      comment: string;
      severity: 'info' | 'warning' | 'error';
    }>;
    created_at: string;
    updated_at: string;
  }>> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/reviews`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Import/Export
  async exportPolicy(policyId: string, format: 'json' | 'yaml' | 'terraform'): Promise<{
    content: string;
    filename: string;
    mime_type: string;
  }> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/${policyId}/export?format=${format}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async importPolicy(content: string, format: 'json' | 'yaml' | 'terraform'): Promise<PrometheiosPolicy> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        content,
        format,
      }),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Search and Discovery
  async searchPolicies(query: string, filters?: {
    categories?: string[];
    tags?: string[];
    compliance_standards?: string[];
    effectiveness_threshold?: number;
  }): Promise<Array<PrometheiosPolicy & {
    relevance_score: number;
    highlighted_fields: string[];
  }>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (filters?.categories) {
      filters.categories.forEach(cat => params.append('categories', cat));
    }
    if (filters?.tags) {
      filters.tags.forEach(tag => params.append('tags', tag));
    }
    if (filters?.compliance_standards) {
      filters.compliance_standards.forEach(std => params.append('compliance_standards', std));
    }
    if (filters?.effectiveness_threshold) {
      params.append('effectiveness_threshold', filters.effectiveness_threshold.toString());
    }

    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/policies/search?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // Enhanced Features - Policy Recommendations
  async getPolicyRecommendations(context: {
    agent_type?: string;
    use_case?: string;
    compliance_requirements?: string[];
    risk_tolerance?: 'low' | 'medium' | 'high';
  }): Promise<Array<{
    policy_template: Partial<PrometheiosPolicy>;
    recommendation_score: number;
    rationale: string;
    compliance_coverage: string[];
    estimated_effectiveness: number;
  }>> {
    const response = await fetch(`${PROMETHIOS_POLICY_ENDPOINT}/recommendations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(context),
    });

    return handleResponse(response);
  }
};

export default prometheiosPolicyAPI;

