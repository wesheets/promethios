import { unifiedStorage } from './UnifiedStorageService';
import { useAuth } from '../context/AuthContext';

export interface AgentProfile {
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    ownerId: string;
    creationDate: Date;
    lastModifiedDate: Date;
    status: string;
  };
  latestScorecard: any | null;
  attestationCount: number;
  lastActivity: Date | null;
  healthStatus: 'healthy' | 'warning' | 'critical';
  trustLevel: 'low' | 'medium' | 'high';
  isWrapped: boolean;
  governancePolicy: any | null;
  isDeployed: boolean;
  apiDetails?: {
    endpoint: string;
    key: string;
    provider: string;
    selectedModel?: string;
    selectedCapabilities?: string[];
    selectedContextLength?: number;
    discoveredInfo?: any;
  };
}

export interface AgentScorecard {
  agentId: string;
  userId: string;
  score: number;
  metrics: {
    reliability: number;
    performance: number;
    security: number;
    compliance: number;
  };
  lastUpdated: Date;
  violations: any[];
  recommendations: string[];
}

/**
 * User-scoped agent storage service with privacy isolation
 */
export class UserAgentStorageService {
  private currentUserId: string | null = null;

  setCurrentUser(userId: string) {
    this.currentUserId = userId;
  }

  private getUserKey(key: string): string {
    if (!this.currentUserId) {
      throw new Error('No user set for agent storage service');
    }
    return `${this.currentUserId}.${key}`;
  }

  /**
   * Save an agent to user-scoped storage
   */
  async saveAgent(agent: AgentProfile): Promise<void> {
    try {
      const userKey = this.getUserKey(agent.identity.id);
      
      // Serialize dates for storage
      const serializedAgent = {
        ...agent,
        identity: {
          ...agent.identity,
          creationDate: agent.identity.creationDate.toISOString(),
          lastModifiedDate: agent.identity.lastModifiedDate.toISOString(),
        },
        lastActivity: agent.lastActivity?.toISOString() || null,
      };

      await unifiedStorage.set('agents', userKey, serializedAgent);
      
      // Also create initial scorecard
      await this.createInitialScorecard(agent);
      
      console.log(`Agent ${agent.identity.name} saved to user storage`);
    } catch (error) {
      console.error('Error saving agent:', error);
      throw error;
    }
  }

  /**
   * Load all agents for the current user
   */
  async loadUserAgents(): Promise<AgentProfile[]> {
    try {
      if (!this.currentUserId) {
        console.warn('No user set, returning empty agents list');
        return [];
      }

      const allKeys = await unifiedStorage.keys('agents');
      const userPrefix = `${this.currentUserId}.`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      const agents: AgentProfile[] = [];

      for (const key of userKeys) {
        try {
          const agentData = await unifiedStorage.get<any>('agents', key);
          if (agentData) {
            // Deserialize dates
            const agent: AgentProfile = {
              ...agentData,
              identity: {
                ...agentData.identity,
                creationDate: new Date(agentData.identity.creationDate),
                lastModifiedDate: new Date(agentData.identity.lastModifiedDate),
              },
              lastActivity: agentData.lastActivity ? new Date(agentData.lastActivity) : null,
            };
            agents.push(agent);
          }
        } catch (error) {
          console.error(`Error loading agent with key ${key}:`, error);
        }
      }

      console.log(`Loaded ${agents.length} agents for user ${this.currentUserId}`);
      return agents;
    } catch (error) {
      console.error('Error loading user agents:', error);
      return [];
    }
  }

  /**
   * Delete an agent from user storage
   */
  async deleteAgent(agentId: string): Promise<void> {
    try {
      const userKey = this.getUserKey(agentId);
      await unifiedStorage.delete('agents', userKey);
      
      // Also delete scorecard
      await this.deleteScorecard(agentId);
      
      console.log(`Agent ${agentId} deleted from user storage`);
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  /**
   * Create initial scorecard for a new agent
   */
  private async createInitialScorecard(agent: AgentProfile): Promise<void> {
    try {
      const scorecard: AgentScorecard = {
        agentId: agent.identity.id,
        userId: this.currentUserId!,
        score: 85, // Initial score
        metrics: {
          reliability: 90,
          performance: 85,
          security: 80,
          compliance: 85,
        },
        lastUpdated: new Date(),
        violations: [],
        recommendations: [
          'Complete governance policy setup',
          'Enable monitoring and alerting',
          'Review security configurations',
        ],
      };

      const scorecardKey = this.getUserKey(`scorecard.${agent.identity.id}`);
      
      // Serialize dates
      const serializedScorecard = {
        ...scorecard,
        lastUpdated: scorecard.lastUpdated.toISOString(),
      };

      await unifiedStorage.set('agents', scorecardKey, serializedScorecard);
      console.log(`Initial scorecard created for agent ${agent.identity.name}`);
    } catch (error) {
      console.error('Error creating initial scorecard:', error);
    }
  }

  /**
   * Load scorecard for an agent
   */
  async loadScorecard(agentId: string): Promise<AgentScorecard | null> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${agentId}`);
      const scorecardData = await unifiedStorage.get<any>('agents', scorecardKey);
      
      if (scorecardData) {
        return {
          ...scorecardData,
          lastUpdated: new Date(scorecardData.lastUpdated),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading scorecard:', error);
      return null;
    }
  }

  /**
   * Update scorecard for an agent
   */
  async updateScorecard(scorecard: AgentScorecard): Promise<void> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${scorecard.agentId}`);
      
      const serializedScorecard = {
        ...scorecard,
        lastUpdated: scorecard.lastUpdated.toISOString(),
      };

      await unifiedStorage.set('agents', scorecardKey, serializedScorecard);
      console.log(`Scorecard updated for agent ${scorecard.agentId}`);
    } catch (error) {
      console.error('Error updating scorecard:', error);
      throw error;
    }
  }

  /**
   * Delete scorecard for an agent
   */
  private async deleteScorecard(agentId: string): Promise<void> {
    try {
      const scorecardKey = this.getUserKey(`scorecard.${agentId}`);
      await unifiedStorage.delete('agents', scorecardKey);
    } catch (error) {
      console.error('Error deleting scorecard:', error);
    }
  }

  /**
   * Get storage statistics for the current user
   */
  async getUserStorageStats(): Promise<{
    agentCount: number;
    scorecardCount: number;
    totalSize: number;
  }> {
    try {
      if (!this.currentUserId) {
        return { agentCount: 0, scorecardCount: 0, totalSize: 0 };
      }

      const allKeys = await unifiedStorage.keys('agents');
      const userPrefix = `${this.currentUserId}.`;
      const userKeys = allKeys.filter(key => key.startsWith(userPrefix));

      const agentKeys = userKeys.filter(key => !key.includes('scorecard.'));
      const scorecardKeys = userKeys.filter(key => key.includes('scorecard.'));

      return {
        agentCount: agentKeys.length,
        scorecardCount: scorecardKeys.length,
        totalSize: userKeys.length,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { agentCount: 0, scorecardCount: 0, totalSize: 0 };
    }
  }
}

// Singleton instance
export const userAgentStorage = new UserAgentStorageService();

