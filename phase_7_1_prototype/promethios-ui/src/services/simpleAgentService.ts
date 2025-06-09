import FirebaseTeamService from '../services/firebaseTeamService';

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
   * Get user's agents (simplified view)
   */
  static async getUserAgents(userId: string): Promise<SimpleAgentConfig[]> {
    return FirebaseTeamService.getUserAgents(userId);
  }

  /**
   * Get user's teams (simplified view)
   */
  static async getUserTeams(userId: string): Promise<TeamSummary[]> {
    return FirebaseTeamService.getUserTeams(userId);
  }

  /**
   * Get agent details
   */
  static async getAgentDetails(agentId: string): Promise<SimpleAgentConfig | null> {
    return FirebaseTeamService.getAgentDetails(agentId);
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
    return FirebaseTeamService.createTeam({
      ...teamData,
      teamType: teamData.teamType as 'collaborative' | 'hierarchical' | 'specialized' | 'custom'
    });
  }

  /**
   * Get team details
   */
  static async getTeamDetails(teamId: string): Promise<any> {
    return FirebaseTeamService.getTeamDetails(teamId);
  }

  /**
   * Add agent to team
   */
  static async addAgentToTeam(teamId: string, agentId: string, roleId: string): Promise<{ success: boolean; error?: string }> {
    return FirebaseTeamService.addAgentToTeam(teamId, agentId, roleId);
  }

  /**
   * Remove agent from team
   */
  static async removeAgentFromTeam(teamId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
    return FirebaseTeamService.removeAgentFromTeam(teamId, agentId);
  }

  /**
   * Get team metrics
   */
  static async getTeamMetrics(teamId: string): Promise<any> {
    return FirebaseTeamService.getTeamMetrics(teamId);
  }

  /**
   * Convert AgentConfiguration to SimpleAgentConfig
   */
  static convertToSimpleConfig = FirebaseTeamService.convertToSimpleConfig;

  /**
   * Convert SimpleAgentConfig to AgentConfiguration
   */
  static convertToAgentConfiguration = FirebaseTeamService.convertToAgentConfiguration;
}

export default SimpleAgentService;

