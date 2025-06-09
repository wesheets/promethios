import AgentFirebaseService from '../firebase/agentService';

export interface GovernanceRequest {
  text: string;
  features: {
    veritas: boolean;
    safety: boolean;
    role: boolean;
  };
  role: string;
  scenario: string;
  agentId?: string;
}

export interface GovernanceResponse {
  originalText: string;
  modifiedText: string;
  trustScore: number;
  violations: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    article: number;
  }>;
  complianceRate: number;
  governanceApplied: boolean;
}

export interface ComparisonRequest {
  prompt: string;
  agentId: string;
  governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum';
}

export interface ComparisonResponse {
  governed: {
    response: string;
    trustScore: number;
    violations: GovernanceResponse['violations'];
    processingTime: number;
  };
  ungoverned: {
    response: string;
    processingTime: number;
  };
  comparison: {
    trustDifference: number;
    violationsPrevented: number;
    safetyImprovement: number;
  };
}

class GovernanceService {
  private baseUrl = '/api';

  async analyzeGovernance(request: GovernanceRequest): Promise<GovernanceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/governance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Governance analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Governance analysis error:', error);
      throw error;
    }
  }

  async compareGovernedVsUngoverned(request: ComparisonRequest): Promise<ComparisonResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/governance/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Governance comparison failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Governance comparison error:', error);
      throw error;
    }
  }

  async sendMessage(
    agentId: string, 
    message: string, 
    governanceEnabled: boolean,
    governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum' = 'standard'
  ): Promise<{ response: string; trustScore?: number; violations?: GovernanceResponse['violations'] }> {
    try {
      // Get agent configuration
      const agent = await AgentFirebaseService.getAgentConfiguration(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const requestBody = {
        message,
        agentId,
        governanceEnabled,
        governanceLevel,
        agentType: agent.agentType,
        apiEndpoint: agent.apiEndpoint,
      };

      const response = await fetch(`${this.baseUrl}/llm-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Message sending failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update agent activity
      await AgentFirebaseService.updateAgentActivity(agentId);

      return result;
    } catch (error) {
      console.error('Message sending error:', error);
      throw error;
    }
  }

  async getGovernanceMetrics(agentId: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h') {
    try {
      const response = await fetch(`${this.baseUrl}/governance/metrics/${agentId}?range=${timeRange}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch governance metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Governance metrics error:', error);
      // Return mock data for development
      return {
        averageTrustScore: 85,
        totalViolations: 12,
        complianceRate: 94,
        violationsByType: {
          'role_adherence': 5,
          'safety': 3,
          'accuracy': 4,
        },
        trustTrend: [82, 84, 85, 87, 85],
      };
    }
  }

  // Mock implementation for development
  async mockGovernanceToggle(
    message: string, 
    agentId: string,
    governanceLevel: 'basic' | 'standard' | 'strict' | 'maximum'
  ): Promise<ComparisonResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const baseResponse = `I understand you're asking about "${message}". Let me provide a helpful response.`;
    
    return {
      governed: {
        response: `${baseResponse} [Governance Applied: Trust verification enabled, safety filters active, role adherence enforced]`,
        trustScore: 92,
        violations: [],
        processingTime: 1200,
      },
      ungoverned: {
        response: `${baseResponse} [Raw response without governance oversight]`,
        processingTime: 800,
      },
      comparison: {
        trustDifference: 92,
        violationsPrevented: 0,
        safetyImprovement: 15,
      },
    };
  }
}

export const governanceService = new GovernanceService();

