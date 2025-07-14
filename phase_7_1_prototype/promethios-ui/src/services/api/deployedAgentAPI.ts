/**
 * Deployed Agent API Service
 * 
 * Handles communication with deployed agents reporting back to Promethios.
 * This service defines the API contract for deployed agents to send metrics,
 * logs, heartbeats, and violation reports.
 */

import apiConfig, { DEPLOYMENT_API } from '../../config/api';

// Types for deployed agent communication
export interface AgentHeartbeat {
  agentId: string;
  governanceIdentity: string;
  timestamp: string;
  status: 'active' | 'inactive' | 'error';
  uptime: number;
  lastActivity: string;
  environment: {
    platform: string;
    version: string;
    location?: string;
    resourceUsage?: {
      cpu: number;
      memory: number;
      requests: number;
    };
  };
}

export interface AgentMetrics {
  agentId: string;
  governanceIdentity: string;
  timestamp: string;
  metrics: {
    trustScore: number;
    interactions: number;
    responseTime: number;
    successRate: number;
    violationsCount: number;
  };
  governanceEvents: {
    policyChecks: number;
    trustCalculations: number;
    complianceValidations: number;
  };
  environment: {
    platform: string;
    version: string;
    location?: string;
  };
}

export interface PolicyViolation {
  agentId: string;
  governanceIdentity: string;
  timestamp: string;
  violation: {
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    policyId: string;
    context: any;
    userImpact?: string;
    autoResolved?: boolean;
  };
  environment: {
    platform: string;
    version: string;
    location?: string;
  };
}

export interface AgentLogEntry {
  agentId: string;
  governanceIdentity: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: any;
  governanceEvent: boolean;
  category: 'system' | 'governance' | 'user_interaction' | 'error';
}

export interface AgentAPIKey {
  agentId: string;
  apiKey: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  lastUsed?: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface DeployedAgentStatus {
  agentId: string;
  governanceIdentity: string;
  status: 'active' | 'inactive' | 'error' | 'suspended';
  lastHeartbeat: string;
  deployedAt: string;
  platform: string;
  version: string;
  metricsHealth: 'healthy' | 'degraded' | 'offline';
  violationsToday: number;
  trustScore: number;
}

/**
 * API endpoints for deployed agents to communicate with Promethios
 */
export class DeployedAgentAPI {
  private baseUrl: string;
  
  // Add instance property to prevent minification
  readonly className = 'DeployedAgentAPI';
  
  constructor() {
    this.baseUrl = DEPLOYMENT_API.BASE;
    console.log('🔧 DeployedAgentAPI constructor called');
  }

  /**
   * Receive heartbeat from deployed agent
   */
  async receiveHeartbeat(heartbeat: AgentHeartbeat, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Agent-ID': heartbeat.agentId,
          'X-Governance-ID': heartbeat.governanceIdentity
        },
        body: JSON.stringify(heartbeat)
      });

      if (!response.ok) {
        throw new Error(`Heartbeat failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to receive heartbeat:', error);
      throw error;
    }
  }

  /**
   * Receive metrics from deployed agent
   */
  async receiveMetrics(metrics: AgentMetrics, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/governance/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Agent-ID': metrics.agentId,
          'X-Governance-ID': metrics.governanceIdentity
        },
        body: JSON.stringify(metrics)
      });

      if (!response.ok) {
        throw new Error(`Metrics submission failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to receive metrics:', error);
      throw error;
    }
  }

  /**
   * Receive policy violation from deployed agent
   */
  async receiveViolation(violation: PolicyViolation, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/governance/violations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Agent-ID': violation.agentId,
          'X-Governance-ID': violation.governanceIdentity
        },
        body: JSON.stringify(violation)
      });

      if (!response.ok) {
        throw new Error(`Violation report failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to receive violation:', error);
      throw error;
    }
  }

  /**
   * Receive log entry from deployed agent
   */
  async receiveLogs(logEntry: AgentLogEntry, apiKey: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'X-Agent-ID': logEntry.agentId,
          'X-Governance-ID': logEntry.governanceIdentity
        },
        body: JSON.stringify(logEntry)
      });

      if (!response.ok) {
        throw new Error(`Log submission failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to receive logs:', error);
      throw error;
    }
  }

  /**
   * Generate API key for deployed agent
   */
  async generateAPIKey(agentId: string, userId: string): Promise<AgentAPIKey> {
    try {
      const response = await fetch(DEPLOYMENT_API.GENERATE_API_KEY(agentId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getUserToken()}`,
          'X-User-ID': userId
        },
        body: JSON.stringify({
          permissions: ['metrics.write', 'logs.write', 'heartbeat.write', 'violations.write']
        })
      });

      if (!response.ok) {
        throw new Error(`API key generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to generate API key:', error);
      throw error;
    }
  }

  /**
   * Get status of deployed agent
   */
  async getAgentStatus(agentId: string, userId: string): Promise<DeployedAgentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getUserToken()}`,
          'X-User-ID': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get agent status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get agent status:', error);
      throw error;
    }
  }

  /**
   * Get all deployed agents for user
   */
  async getUserDeployedAgents(userId: string): Promise<DeployedAgentStatus[]> {
    try {
      const response = await fetch(DEPLOYMENT_API.DEPLOYED_AGENTS(userId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getUserToken()}`,
          'X-User-ID': userId
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get deployed agents: ${response.statusText}`);
      }

      const data = await response.json();
      return data.agents || [];
    } catch (error) {
      console.error('Failed to get deployed agents:', error);
      // Return empty array instead of throwing - no mock data
      return [];
    }
  }

  /**
   * Revoke API key for deployed agent
   */
  async revokeAPIKey(agentId: string, userId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/api-key`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await this.getUserToken()}`,
          'X-User-ID': userId
        }
      });

      if (!response.ok) {
        throw new Error(`API key revocation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to revoke API key:', error);
      throw error;
    }
  }

  /**
   * Get user authentication token
   */
  private async getUserToken(): Promise<string> {
    // This would integrate with your existing auth system
    // For now, return a placeholder that will be replaced with real auth
    return 'user-auth-token-placeholder';
  }

  /**
   * Validate API key format
   */
  static validateAPIKey(apiKey: string): boolean {
    // API keys should follow format: promethios_<agentId>_<secureToken>
    const pattern = /^promethios_[a-zA-Z0-9-]+_[a-zA-Z0-9]+$/;
    return pattern.test(apiKey);
  }

  /**
   * Extract agent ID from API key
   */
  static extractAgentIdFromAPIKey(apiKey: string): string | null {
    if (!this.validateAPIKey(apiKey)) {
      return null;
    }
    
    const parts = apiKey.split('_');
    return parts.length >= 3 ? parts[1] : null;
  }
}

// Export singleton instance with defensive constructor pattern
let deployedAgentAPIInstance: DeployedAgentAPI | null = null;

function createDeployedAgentAPI(): DeployedAgentAPI {
  try {
    // Use explicit constructor reference to avoid minification issues
    const APIClass = DeployedAgentAPI;
    if (typeof APIClass !== 'function') {
      throw new Error('DeployedAgentAPI is not a constructor');
    }
    const instance = new APIClass();
    console.log('✅ DeployedAgentAPI instance created successfully');
    return instance;
  } catch (error) {
    console.error('❌ Error creating DeployedAgentAPI:', error);
    // Return a fallback implementation
    return {
      receiveHeartbeat: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      receiveMetrics: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      receiveViolation: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      receiveLogs: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      generateAPIKey: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      getAgentStatus: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      getUserDeployedAgents: async () => [],
      revokeAPIKey: async () => { throw new Error('DeployedAgentAPI unavailable'); },
      validateAPIKey: () => false,
      extractAgentIdFromKey: () => null
    } as any;
  }
}

export const deployedAgentAPI = deployedAgentAPIInstance || (deployedAgentAPIInstance = createDeployedAgentAPI());

