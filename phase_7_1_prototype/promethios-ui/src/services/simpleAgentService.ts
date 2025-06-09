import { AgentConfiguration } from '../firebase/agentService';

/**
 * Simple Agent Service
 * 
 * This service provides a simplified interface for agent management
 * that works with both individual agents and team-based workflows.
 * It maintains backward compatibility with the existing Firebase agent service.
 */

export interface SimpleAgentConfig {
  id: string;
  name: string;
  description: string;
  agentType: 'llm' | 'multimodal' | 'custom';
  apiEndpoint?: string;
  governanceLevel: 'basic' | 'standard' | 'advanced';
  trustScore: number;
  status: 'active' | 'inactive' | 'pending';
  lastActivity?: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  description: string;
  teamType: 'collaborative' | 'hierarchical' | 'specialized' | 'custom';
  memberCount: number;
  averageTrustScore: number;
  status: 'active' | 'inactive';
}

class SimpleAgentService {
  private static readonly API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  /**
   * Get user's agents (simplified view)
   */
  static async getUserAgents(userId: string): Promise<SimpleAgentConfig[]> {
    try {
      // This would integrate with Firebase in production
      // For now, return demo data that matches the existing structure
      return [
        {
          id: 'agent-1',
          name: 'Research Assistant',
          description: 'AI agent specialized in research and fact-checking',
          agentType: 'llm',
          apiEndpoint: 'https://api.openai.com/v1/chat/completions',
          governanceLevel: 'standard',
          trustScore: 87,
          status: 'active',
          lastActivity: new Date().toISOString()
        },
        {
          id: 'agent-2',
          name: 'Content Creator',
          description: 'AI agent for content creation and writing',
          agentType: 'llm',
          governanceLevel: 'basic',
          trustScore: 82,
          status: 'active',
          lastActivity: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'agent-3',
          name: 'Code Reviewer',
          description: 'AI agent for code review and analysis',
          agentType: 'custom',
          apiEndpoint: 'https://api.claude.ai/v1/messages',
          governanceLevel: 'advanced',
          trustScore: 94,
          status: 'active',
          lastActivity: new Date(Date.now() - 7200000).toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching user agents:', error);
      return [];
    }
  }

  /**
   * Get user's teams (simplified view)
   */
  static async getUserTeams(userId: string): Promise<TeamSummary[]> {
    try {
      const response = await fetch(`${this.API_BASE}/teams`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.teams.map((team: any) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        teamType: team.teamType,
        memberCount: team.memberCount,
        averageTrustScore: team.metrics?.averageTeamTrustScore || 0,
        status: team.status
      }));

    } catch (error) {
      console.error('Error fetching user teams:', error);
      return [];
    }
  }

  /**
   * Get agent details
   */
  static async getAgentDetails(agentId: string): Promise<SimpleAgentConfig | null> {
    try {
      // This would integrate with Firebase in production
      const agents = await this.getUserAgents('demo-user');
      return agents.find(agent => agent.id === agentId) || null;
    } catch (error) {
      console.error('Error fetching agent details:', error);
      return null;
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(teamData: {
    name: string;
    description: string;
    teamType: string;
    maxMembers?: number;
    initialMembers?: Array<{ agentId: string; roleId: string }>;
  }): Promise<{ success: boolean; teamId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create team' };
      }

      const data = await response.json();
      return { success: true, teamId: data.teamId };

    } catch (error) {
      console.error('Error creating team:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get team details
   */
  static async getTeamDetails(teamId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/teams/${teamId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.team;

    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }

  /**
   * Add agent to team
   */
  static async addAgentToTeam(teamId: string, agentId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        },
        body: JSON.stringify({ agentId, roleId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to add agent to team' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error adding agent to team:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Remove agent from team
   */
  static async removeAgentFromTeam(teamId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/teams/${teamId}/members/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to remove agent from team' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error removing agent from team:', error);
      return { success: false, error: 'Network error' };
    }
  }

  /**
   * Get team metrics
   */
  static async getTeamMetrics(teamId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/teams/${teamId}/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add authentication headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.metrics;

    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return null;
    }
  }

  /**
   * Convert AgentConfiguration to SimpleAgentConfig
   */
  static convertToSimpleConfig(agentConfig: AgentConfiguration): SimpleAgentConfig {
    return {
      id: agentConfig.id || '',
      name: agentConfig.name,
      description: agentConfig.description,
      agentType: agentConfig.agentType,
      apiEndpoint: agentConfig.apiEndpoint,
      governanceLevel: agentConfig.governanceLevel,
      trustScore: agentConfig.trustScore || 0,
      status: agentConfig.status,
      lastActivity: agentConfig.lastActivity
    };
  }

  /**
   * Convert SimpleAgentConfig to AgentConfiguration
   */
  static convertToAgentConfiguration(simpleConfig: SimpleAgentConfig, userId: string): Omit<AgentConfiguration, 'id'> {
    return {
      userId: userId,
      name: simpleConfig.name,
      description: simpleConfig.description,
      agentType: simpleConfig.agentType,
      apiEndpoint: simpleConfig.apiEndpoint,
      governanceLevel: simpleConfig.governanceLevel,
      trustScore: simpleConfig.trustScore,
      complianceScore: 90, // Default compliance score
      status: simpleConfig.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActivity: simpleConfig.lastActivity
    };
  }
}

export default SimpleAgentService;

