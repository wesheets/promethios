import { firebaseTeamService } from '../services/firebaseTeamService';

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
  /**
   * Get user's teams (simplified view)
   */
  static async getUserTeams(userId: string): Promise<TeamSummary[]> {
    try {
      const teams = await firebaseTeamService.getTeamsByUserId(userId);
      return teams.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        teamType: 'collaborative' as const,
        memberCount: 0, // This would need to be calculated
        averageTrustScore: 0, // This would need to be calculated
        status: 'active' as const
      }));
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(teamData: {
    name: string;
    description: string;
    teamType: string;
    ownerId: string;
    maxMembers?: number;
    initialMembers?: Array<{ agentId: string; roleId: string }>;
  }): Promise<{ success: boolean; teamId?: string; error?: string }> {
    try {
      const teamId = await firebaseTeamService.createTeam({
        name: teamData.name,
        description: teamData.description,
        ownerId: teamData.ownerId,
        maxMembers: teamData.maxMembers || 10
      });
      
      return { success: true, teamId };
    } catch (error) {
      console.error('Error creating team:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get team details
   */
  static async getTeamDetails(teamId: string): Promise<any> {
    try {
      const team = await firebaseTeamService.getTeamById(teamId);
      const members = await firebaseTeamService.getTeamMembers(teamId);
      
      return {
        ...team,
        members
      };
    } catch (error) {
      console.error('Error getting team details:', error);
      return null;
    }
  }

  /**
   * Add member to team
   */
  static async addAgentToTeam(teamId: string, userId: string, role: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firebaseTeamService.addTeamMember({
        teamId,
        userId,
        role: role as any, // Type assertion for compatibility
        permissions: []
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding agent to team:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Remove member from team
   */
  static async removeAgentFromTeam(teamId: string, memberId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await firebaseTeamService.removeTeamMember(memberId);
      return { success: true };
    } catch (error) {
      console.error('Error removing agent from team:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get team metrics (placeholder implementation)
   */
  static async getTeamMetrics(teamId: string): Promise<any> {
    try {
      const team = await firebaseTeamService.getTeamById(teamId);
      const members = await firebaseTeamService.getTeamMembers(teamId);
      
      return {
        teamId,
        memberCount: members.length,
        averageTrustScore: 0, // Would need to be calculated based on actual metrics
        lastActivity: team?.updatedAt || new Date(),
        status: 'active'
      };
    } catch (error) {
      console.error('Error getting team metrics:', error);
      return null;
    }
  }

  /**
   * Get user's agents (placeholder - would need actual agent service)
   */
  static async getUserAgents(userId: string): Promise<SimpleAgentConfig[]> {
    // This would need to be implemented with an actual agent service
    console.log('getUserAgents called for user:', userId);
    return [];
  }

  /**
   * Get agent details (placeholder - would need actual agent service)
   */
  static async getAgentDetails(agentId: string): Promise<SimpleAgentConfig | null> {
    // This would need to be implemented with an actual agent service
    console.log('getAgentDetails called for agent:', agentId);
    return null;
  }

  /**
   * Convert AgentConfiguration to SimpleAgentConfig (placeholder)
   */
  static convertToSimpleConfig(agentConfig: any): SimpleAgentConfig {
    return {
      id: agentConfig.id || '',
      name: agentConfig.name || '',
      description: agentConfig.description || '',
      agentType: agentConfig.agentType || 'llm',
      apiEndpoint: agentConfig.apiEndpoint,
      governanceLevel: agentConfig.governanceLevel || 'basic',
      trustScore: agentConfig.trustScore || 0,
      status: agentConfig.status || 'inactive',
      lastActivity: agentConfig.lastActivity
    };
  }

  /**
   * Convert SimpleAgentConfig to AgentConfiguration (placeholder)
   */
  static convertToAgentConfiguration(simpleConfig: SimpleAgentConfig): any {
    return {
      id: simpleConfig.id,
      name: simpleConfig.name,
      description: simpleConfig.description,
      agentType: simpleConfig.agentType,
      apiEndpoint: simpleConfig.apiEndpoint,
      governanceLevel: simpleConfig.governanceLevel,
      trustScore: simpleConfig.trustScore,
      status: simpleConfig.status,
      lastActivity: simpleConfig.lastActivity
    };
  }
}

export default SimpleAgentService;

