/**
 * Agent Backend Service
 * 
 * Service that connects the frontend to the real backend agent APIs.
 * Replaces mock data with real API calls to the FastAPI backend.
 */

// Backend API configuration
const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Types for backend API responses
export interface BackendAgentProfile {
  agent_id: string;
  name: string;
  description?: string;
  version: string;
  governance_identity: {
    type: string;
    constitution_hash: string;
    compliance_level: string;
    verification_endpoint: string;
  };
  deployment_status: string;
  health_status: string;
  trust_score: {
    score?: number;
    last_calculated?: string;
    calculation_method: string;
  };
  created_at: string;
  last_updated: string;
  owner_id: string;
}

export interface BackendAgentScorecard {
  agent_id: string;
  scorecard_id: string;
  timestamp: string;
  governance_identity: {
    type: string;
    constitution_hash: string;
    compliance_level: string;
    verification_endpoint: string;
  };
  trust_score: {
    score?: number;
    last_calculated?: string;
    calculation_method: string;
  };
  reflection_compliance: {
    percentage: number;
    total_reflections: number;
    compliant_reflections: number;
  };
  belief_trace_integrity: {
    percentage: number;
    total_outputs: number;
    verified_outputs: number;
  };
  violation_history: {
    count: number;
    categories: Record<string, number>;
    recent_violations: any[];
  };
  performance_metrics: {
    task_completion_rate: number;
    average_response_time_ms: number;
    resource_efficiency_score: number;
    uptime_percentage: number;
  };
  warning_state: {
    has_warning: boolean;
    warning_level: string;
    warning_message: string;
  };
  health_status: string;
  deployment_status: string;
}

export interface AgentRegistrationRequest {
  agent_id: string;
  name: string;
  description?: string;
  governance_framework: string;
  capabilities: string[];
  owner_id: string;
}

export interface AgentRegistrationResponse {
  agent_id: string;
  status: string;
  governance_identity_id: string;
}

/**
 * Agent Backend Service Class
 */
export class AgentBackendService {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Register a new agent with the backend
   */
  async registerAgent(request: AgentRegistrationRequest): Promise<AgentRegistrationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to register agent: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error registering agent:', error);
      throw error;
    }
  }

  /**
   * Get agent profile by ID
   */
  async getAgentProfile(agentId: string): Promise<BackendAgentProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/profile`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get agent profile: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting agent profile:', error);
      throw error;
    }
  }

  /**
   * Get agent scorecard by ID
   */
  async getAgentScorecard(agentId: string): Promise<BackendAgentScorecard> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/scorecard`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get agent scorecard: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting agent scorecard:', error);
      throw error;
    }
  }

  /**
   * List all agents for a user
   */
  async listAgents(ownerId?: string, limit: number = 50): Promise<BackendAgentProfile[]> {
    try {
      const params = new URLSearchParams();
      if (ownerId) params.append('owner_id', ownerId);
      params.append('limit', limit.toString());

      const response = await fetch(`${this.baseUrl}/api/agents?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to list agents: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing agents:', error);
      throw error;
    }
  }

  /**
   * Generate a new scorecard for an agent
   */
  async generateAgentScorecard(agentId: string, forceRecalculate: boolean = false): Promise<{ message: string }> {
    try {
      const params = new URLSearchParams();
      if (forceRecalculate) params.append('force_recalculate', 'true');

      const response = await fetch(`${this.baseUrl}/api/agents/${agentId}/scorecard/generate?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate scorecard: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating agent scorecard:', error);
      throw error;
    }
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking backend health:', error);
      throw error;
    }
  }

  /**
   * Transform backend agent profile to frontend format
   */
  transformAgentProfile(backendProfile: BackendAgentProfile): any {
    return {
      id: backendProfile.agent_id,
      name: backendProfile.name,
      description: backendProfile.description || '',
      version: backendProfile.version,
      status: backendProfile.deployment_status,
      healthStatus: backendProfile.health_status,
      trustScore: backendProfile.trust_score.score || 0,
      governanceIdentity: {
        type: backendProfile.governance_identity.type,
        constitutionHash: backendProfile.governance_identity.constitution_hash,
        complianceLevel: backendProfile.governance_identity.compliance_level,
        verificationEndpoint: backendProfile.governance_identity.verification_endpoint,
      },
      createdAt: backendProfile.created_at,
      lastUpdated: backendProfile.last_updated,
      ownerId: backendProfile.owner_id,
    };
  }

  /**
   * Transform backend scorecard to frontend format
   */
  transformAgentScorecard(backendScorecard: BackendAgentScorecard): any {
    return {
      agentId: backendScorecard.agent_id,
      scorecardId: backendScorecard.scorecard_id,
      timestamp: backendScorecard.timestamp,
      trustScore: backendScorecard.trust_score.score || 0,
      healthStatus: backendScorecard.health_status,
      deploymentStatus: backendScorecard.deployment_status,
      governanceIdentity: {
        type: backendScorecard.governance_identity.type,
        constitutionHash: backendScorecard.governance_identity.constitution_hash,
        complianceLevel: backendScorecard.governance_identity.compliance_level,
        verificationEndpoint: backendScorecard.governance_identity.verification_endpoint,
      },
      performanceMetrics: {
        taskCompletionRate: backendScorecard.performance_metrics.task_completion_rate,
        averageResponseTime: backendScorecard.performance_metrics.average_response_time_ms,
        resourceEfficiency: backendScorecard.performance_metrics.resource_efficiency_score,
        uptime: backendScorecard.performance_metrics.uptime_percentage,
      },
      complianceMetrics: {
        reflectionCompliance: backendScorecard.reflection_compliance.percentage,
        beliefTraceIntegrity: backendScorecard.belief_trace_integrity.percentage,
        violationCount: backendScorecard.violation_history.count,
      },
      warningState: backendScorecard.warning_state,
    };
  }
}

// Export singleton instance
export const agentBackendService = new AgentBackendService();

