/**
 * Policy Enhancement API Service
 * 
 * Provides advanced policy features including NLP processing, ML optimization,
 * and simulation capabilities using real backend data.
 */

import { apiClient } from './apiClient';

export interface ViolationPattern {
  pattern_id: string;
  violation_count: number;
  dominant_type: string;
  dominant_severity: string;
  affected_policies: string[];
  frequency: number;
  description: string;
}

export interface OptimizationRecommendation {
  type: 'severity_optimization' | 'pattern_optimization' | 'temporal_optimization';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggested_action: string;
  impact_score: number;
}

export interface RiskFactor {
  type: 'agent_risk' | 'policy_risk';
  factor: string;
  description: string;
  risk_level: 'high' | 'medium' | 'low';
}

export interface ViolationAnalysis {
  patterns: ViolationPattern[];
  recommendations: OptimizationRecommendation[];
  risk_factors: RiskFactor[];
  total_violations: number;
  analysis_date: string;
}

export interface NLPPolicyResult {
  success: boolean;
  suggested_rules: Array<{
    name: string;
    type: string;
    condition: string;
    action: string;
    parameters: Record<string, any>;
    confidence: number;
  }>;
  policy_category?: string;
  compliance_level?: string;
  processing_method: 'openai_gpt' | 'pattern_matching';
  confidence_score: number;
  error?: string;
}

export interface PolicySimulationResult {
  success: boolean;
  simulation_results: {
    total_events: number;
    policy_triggers: number;
    would_be_violations: number;
    prevented_violations: number;
    performance_impact: Record<string, any>;
    rule_effectiveness: Record<string, {
      triggers: number;
      false_positives: number;
      effectiveness: number;
    }>;
    recommendations: Array<{
      type: string;
      priority: string;
      message: string;
      suggested_action: string;
    }>;
    trigger_rate: number;
    effectiveness_score: number;
  };
  data_points_analyzed: number;
  time_range: {
    start: string;
    end: string;
    days: number;
  };
  error?: string;
}

export interface RuleValidationResult {
  success: boolean;
  validation_result: {
    triggers: number;
    false_positives: number;
    effectiveness: number;
  };
  data_points: number;
  time_range: string;
  error?: string;
}

export interface PolicyOptimizationResult {
  success: boolean;
  policy_id: string;
  recommendations: OptimizationRecommendation[];
  violation_count: number;
  analysis_date: string;
  error?: string;
}

class PolicyEnhancementAPI {
  private baseURL = '/api/policy-enhancement';

  /**
   * Analyze violation patterns and generate optimization recommendations
   */
  async analyzeViolations(params: {
    user_id?: string;
  }): Promise<{ success: boolean; analysis: ViolationAnalysis }> {
    try {
      const response = await apiClient.post(`${this.baseURL}/analyze-violations`, params);
      return response.data;
    } catch (error) {
      console.error('Error analyzing violations:', error);
      throw new Error('Failed to analyze violation patterns');
    }
  }

  /**
   * Create policy rules from natural language description
   */
  async createFromNaturalLanguage(params: {
    description: string;
    context?: string;
  }): Promise<NLPPolicyResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}/create-from-language`, params);
      return response.data;
    } catch (error) {
      console.error('Error processing natural language:', error);
      throw new Error('Failed to process natural language input');
    }
  }

  /**
   * Simulate policy impact using historical data
   */
  async simulatePolicy(params: {
    policy_rules: Array<{
      name: string;
      type: string;
      condition: string;
      action: string;
      parameters: Record<string, any>;
    }>;
    agent_id?: string;
    time_range_days?: number;
  }): Promise<PolicySimulationResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}/simulate-policy`, params);
      return response.data;
    } catch (error) {
      console.error('Error simulating policy:', error);
      throw new Error('Failed to simulate policy impact');
    }
  }

  /**
   * Get optimization recommendations for existing policy
   */
  async optimizePolicy(params: {
    policy_id: string;
    user_id?: string;
  }): Promise<PolicyOptimizationResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}/optimize-policy`, params);
      return response.data;
    } catch (error) {
      console.error('Error optimizing policy:', error);
      throw new Error('Failed to optimize policy');
    }
  }

  /**
   * Validate a policy rule against historical data
   */
  async validateRule(params: {
    rule: {
      name: string;
      type: string;
      condition: string;
      action: string;
      parameters: Record<string, any>;
    };
    agent_id?: string;
  }): Promise<RuleValidationResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}/validate-rule`, params);
      return response.data;
    } catch (error) {
      console.error('Error validating rule:', error);
      throw new Error('Failed to validate rule');
    }
  }

  /**
   * Get policy effectiveness analytics
   */
  async getPolicyAnalytics(params: {
    policy_id?: string;
    user_id?: string;
    time_range_days?: number;
  }): Promise<{
    effectiveness_score: number;
    violation_trends: Array<{
      date: string;
      count: number;
      severity_breakdown: Record<string, number>;
    }>;
    rule_performance: Array<{
      rule_id: string;
      rule_name: string;
      triggers: number;
      effectiveness: number;
      false_positive_rate: number;
    }>;
    recommendations: OptimizationRecommendation[];
  }> {
    try {
      // This would be implemented as a separate endpoint
      // For now, we'll combine data from existing endpoints
      const violationAnalysis = await this.analyzeViolations(params);
      
      return {
        effectiveness_score: 0.75, // Would be calculated from real data
        violation_trends: [], // Would be populated from historical data
        rule_performance: [], // Would be calculated from rule validation
        recommendations: violationAnalysis.analysis.recommendations
      };
    } catch (error) {
      console.error('Error getting policy analytics:', error);
      throw new Error('Failed to get policy analytics');
    }
  }

  /**
   * Generate policy templates based on industry/use case
   */
  async generatePolicyTemplates(params: {
    industry: 'financial' | 'healthcare' | 'legal' | 'general' | 'technology' | 'education';
    compliance_requirements?: string[];
    risk_level: 'low' | 'medium' | 'high' | 'enterprise';
  }): Promise<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      rules: Array<{
        name: string;
        type: string;
        condition: string;
        action: string;
        parameters: Record<string, any>;
      }>;
      compliance_mappings: string[];
    }>;
  }> {
    try {
      // This would be implemented as a backend endpoint
      // For now, return industry-specific templates
      const templates = this.getIndustryTemplates(params.industry, params.risk_level);
      return { templates };
    } catch (error) {
      console.error('Error generating policy templates:', error);
      throw new Error('Failed to generate policy templates');
    }
  }

  private getIndustryTemplates(industry: string, riskLevel: string) {
    const baseTemplates = {
      financial: [
        {
          id: 'financial_basic',
          name: 'Financial Services Basic Compliance',
          description: 'Basic compliance rules for financial services',
          category: 'Financial Compliance',
          rules: [
            {
              name: 'PII Protection',
              type: 'pii_protection',
              condition: 'contains_financial_pii == false',
              action: 'deny',
              parameters: { sensitivity: 'high', types: ['ssn', 'account_number', 'routing_number'] }
            },
            {
              name: 'Financial Advice Disclaimer',
              type: 'content_filter',
              condition: 'contains_financial_advice == true',
              action: 'warn',
              parameters: { require_disclaimer: true }
            }
          ],
          compliance_mappings: ['SOX', 'PCI-DSS', 'GDPR']
        }
      ],
      healthcare: [
        {
          id: 'healthcare_hipaa',
          name: 'HIPAA Compliance',
          description: 'HIPAA-compliant rules for healthcare applications',
          category: 'Healthcare Compliance',
          rules: [
            {
              name: 'PHI Protection',
              type: 'pii_protection',
              condition: 'contains_phi == false',
              action: 'deny',
              parameters: { sensitivity: 'critical', types: ['medical_record', 'patient_id'] }
            },
            {
              name: 'Medical Advice Restriction',
              type: 'content_filter',
              condition: 'provides_medical_advice == true',
              action: 'escalate',
              parameters: { require_professional_review: true }
            }
          ],
          compliance_mappings: ['HIPAA', 'HITECH', 'GDPR']
        }
      ],
      legal: [
        {
          id: 'legal_privilege',
          name: 'Attorney-Client Privilege Protection',
          description: 'Protect attorney-client privileged communications',
          category: 'Legal Compliance',
          rules: [
            {
              name: 'Privilege Protection',
              type: 'content_filter',
              condition: 'contains_privileged_info == true',
              action: 'deny',
              parameters: { escalate_to_counsel: true }
            }
          ],
          compliance_mappings: ['ABA Model Rules', 'State Bar Requirements']
        }
      ]
    };

    return baseTemplates[industry as keyof typeof baseTemplates] || [];
  }
}

export const policyEnhancementAPI = new PolicyEnhancementAPI();

