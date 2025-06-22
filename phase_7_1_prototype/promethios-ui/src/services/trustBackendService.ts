/**
 * Trust Backend Service
 * 
 * Service layer for communicating with the trust management backend APIs.
 * Handles trust evaluation, scoring, and relationship management.
 */

import { API_BASE_URL } from '../config/api';

export interface TrustEvaluateRequest {
  agent_id: string;
  target_id: string;
  context: Record<string, any>;
  evidence: Array<{
    type: string;
    outcome?: string;
    timestamp?: string;
    details?: Record<string, any>;
    issuer?: string;
    level?: string;
    expiration?: string;
  }>;
  trust_dimensions: string[];
  timestamp?: string;
}

export interface TrustEvaluateResponse {
  evaluation_id: string;
  agent_id: string;
  target_id: string;
  trust_score: number;
  trust_dimensions: Record<string, number>;
  confidence_level: number;
  evaluation_timestamp: string;
  evidence_summary: Record<string, any>;
  recommendations: string[];
}

export interface TrustEvaluation {
  evaluation_id: string;
  agent_id: string;
  target_id: string;
  trust_score: number;
  trust_dimensions: Record<string, number>;
  confidence_level: number;
  evaluation_timestamp: string;
  evidence_summary: Record<string, any>;
  recommendations: string[];
  context: Record<string, any>;
  evidence: Array<Record<string, any>>;
}

export interface TrustQueryRequest {
  agent_id?: string;
  target_id?: string;
  trust_score_min?: number;
  trust_score_max?: number;
  start_time?: string;
  end_time?: string;
  trust_dimensions?: string[];
  limit?: number;
}

export interface TrustQueryResponse {
  evaluations: TrustEvaluation[];
  total: number;
  page: number;
  limit: number;
}

export interface TrustUpdateRequest {
  evaluation_id: string;
  new_evidence: Array<Record<string, any>>;
  context_updates: Record<string, any>;
  timestamp?: string;
}

export interface TrustMetrics {
  total_evaluations: number;
  average_trust_score: number;
  trust_distribution: Record<string, number>;
  recent_evaluations: number;
  high_trust_agents: number;
  low_trust_agents: number;
  trust_trends: {
    daily: Array<{ date: string; average_score: number }>;
    weekly: Array<{ week: string; average_score: number }>;
  };
}

class TrustBackendService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/trust`;
  }

  /**
   * Evaluate trust between agents
   */
  async evaluateTrust(request: TrustEvaluateRequest): Promise<TrustEvaluateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/evaluate`, {
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
      console.error('Error evaluating trust:', error);
      throw error;
    }
  }

  /**
   * Update trust evaluation with new evidence
   */
  async updateTrust(request: TrustUpdateRequest): Promise<TrustEvaluateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
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
      console.error('Error updating trust:', error);
      throw error;
    }
  }

  /**
   * Query trust evaluations with filters
   */
  async queryTrust(request: TrustQueryRequest): Promise<TrustQueryResponse> {
    try {
      const params = new URLSearchParams();
      
      if (request.agent_id) params.append('agent_id', request.agent_id);
      if (request.target_id) params.append('target_id', request.target_id);
      if (request.trust_score_min !== undefined) params.append('trust_score_min', request.trust_score_min.toString());
      if (request.trust_score_max !== undefined) params.append('trust_score_max', request.trust_score_max.toString());
      if (request.start_time) params.append('start_time', request.start_time);
      if (request.end_time) params.append('end_time', request.end_time);
      if (request.trust_dimensions) params.append('trust_dimensions', request.trust_dimensions.join(','));
      if (request.limit) params.append('limit', request.limit.toString());
      
      const response = await fetch(`${this.baseUrl}/query?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error querying trust evaluations:', error);
      return {
        evaluations: [],
        total: 0,
        page: 1,
        limit: request.limit || 100
      };
    }
  }

  /**
   * Get a specific trust evaluation by ID
   */
  async getTrustEvaluation(evaluationId: string): Promise<TrustEvaluation | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${evaluationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trust evaluation:', error);
      return null;
    }
  }

  /**
   * Get trust metrics and statistics
   */
  async getTrustMetrics(): Promise<TrustMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching trust metrics:', error);
      // Return default metrics on error
      return {
        total_evaluations: 0,
        average_trust_score: 0,
        trust_distribution: {},
        recent_evaluations: 0,
        high_trust_agents: 0,
        low_trust_agents: 0,
        trust_trends: {
          daily: [],
          weekly: []
        }
      };
    }
  }

  /**
   * Get trust relationships for a specific agent
   */
  async getAgentTrustRelationships(agentId: string): Promise<TrustEvaluation[]> {
    try {
      const response = await this.queryTrust({ agent_id: agentId });
      return response.evaluations;
    } catch (error) {
      console.error('Error fetching agent trust relationships:', error);
      return [];
    }
  }

  /**
   * Get trust score for a specific agent pair
   */
  async getAgentPairTrustScore(agentId: string, targetId: string): Promise<number | null> {
    try {
      const response = await this.queryTrust({ 
        agent_id: agentId, 
        target_id: targetId,
        limit: 1 
      });
      
      if (response.evaluations.length > 0) {
        return response.evaluations[0].trust_score;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching agent pair trust score:', error);
      return null;
    }
  }
}

export const trustBackendService = new TrustBackendService();
export default trustBackendService;

