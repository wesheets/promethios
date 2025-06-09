import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AgentConfiguration } from '../firebase/agentService';

/**
 * Firebase Team Service
 * 
 * This service provides Firebase-based team management functionality
 * that integrates with the existing agent system.
 */

export interface TeamMember {
  agentId: string;
  roleId: string;
  name: string;
  joinedAt: string;
  permissions: string[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  teamType: 'collaborative' | 'hierarchical' | 'specialized' | 'custom';
  ownerId: string;
  members: TeamMember[];
  maxMembers: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  governanceSettings: {
    requireApproval: boolean;
    trustScoreThreshold: number;
    complianceLevel: 'basic' | 'standard' | 'advanced';
  };
  metrics: {
    averageTrustScore: number;
    totalInteractions: number;
    successRate: number;
    complianceScore: number;
  };
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

class FirebaseTeamService {
  private static readonly TEAMS_COLLECTION = 'teams';
  private static readonly AGENTS_COLLECTION = 'agents';

  /**
   * Get user's teams
   */
  static async getUserTeams(userId: string): Promise<TeamSummary[]> {
    try {
      const teamsRef = collection(db, this.TEAMS_COLLECTION);
      const q = query(
        teamsRef,
        where('ownerId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const teams: TeamSummary[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Team;
        teams.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          teamType: data.teamType,
          memberCount: data.members.length,
          averageTrustScore: data.metrics.averageTrustScore,
          status: data.status
        });
      });
      
      return teams;
    } catch (error) {
      console.error('Error fetching user teams:', error);
      return [];
    }
  }

  /**
   * Get user's agents
   */
  static async getUserAgents(userId: string): Promise<SimpleAgentConfig[]> {
    try {
      const agentsRef = collection(db, this.AGENTS_COLLECTION);
      const q = query(
        agentsRef,
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const agents: SimpleAgentConfig[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as AgentConfiguration;
        agents.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          agentType: data.agentType,
          apiEndpoint: data.apiEndpoint,
          governanceLevel: data.governanceLevel,
          trustScore: data.trustScore || 0,
          status: data.status,
          lastActivity: data.lastActivity
        });
      });
      
      return agents;
    } catch (error) {
      console.error('Error fetching user agents:', error);
      return [];
    }
  }

  /**
   * Create a new team
   */
  static async createTeam(teamData: {
    name: string;
    description: string;
    teamType: 'collaborative' | 'hierarchical' | 'specialized' | 'custom';
    ownerId: string;
    maxMembers?: number;
    initialMembers?: Array<{ agentId: string; roleId: string }>;
  }): Promise<{ success: boolean; teamId?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      
      // Prepare initial members
      const members: TeamMember[] = [];
      if (teamData.initialMembers) {
        for (const member of teamData.initialMembers) {
          // Get agent details
          const agentDoc = await getDoc(doc(db, this.AGENTS_COLLECTION, member.agentId));
          if (agentDoc.exists()) {
            const agentData = agentDoc.data() as AgentConfiguration;
            members.push({
              agentId: member.agentId,
              roleId: member.roleId,
              name: agentData.name,
              joinedAt: now,
              permissions: this.getDefaultPermissions(member.roleId)
            });
          }
        }
      }

      const team: Omit<Team, 'id'> = {
        name: teamData.name,
        description: teamData.description,
        teamType: teamData.teamType,
        ownerId: teamData.ownerId,
        members,
        maxMembers: teamData.maxMembers || 10,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        governanceSettings: {
          requireApproval: teamData.teamType === 'hierarchical',
          trustScoreThreshold: 70,
          complianceLevel: 'standard'
        },
        metrics: {
          averageTrustScore: this.calculateAverageTrustScore(members),
          totalInteractions: 0,
          successRate: 100,
          complianceScore: 100
        }
      };

      const docRef = await addDoc(collection(db, this.TEAMS_COLLECTION), team);
      
      return { success: true, teamId: docRef.id };
    } catch (error) {
      console.error('Error creating team:', error);
      return { success: false, error: 'Failed to create team' };
    }
  }

  /**
   * Get team details
   */
  static async getTeamDetails(teamId: string): Promise<Team | null> {
    try {
      const teamDoc = await getDoc(doc(db, this.TEAMS_COLLECTION, teamId));
      
      if (teamDoc.exists()) {
        return { id: teamDoc.id, ...teamDoc.data() } as Team;
      }
      
      return null;
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
      const teamDoc = await getDoc(doc(db, this.TEAMS_COLLECTION, teamId));
      const agentDoc = await getDoc(doc(db, this.AGENTS_COLLECTION, agentId));
      
      if (!teamDoc.exists()) {
        return { success: false, error: 'Team not found' };
      }
      
      if (!agentDoc.exists()) {
        return { success: false, error: 'Agent not found' };
      }

      const teamData = teamDoc.data() as Team;
      const agentData = agentDoc.data() as AgentConfiguration;
      
      // Check if agent is already in team
      if (teamData.members.some(member => member.agentId === agentId)) {
        return { success: false, error: 'Agent already in team' };
      }
      
      // Check team capacity
      if (teamData.members.length >= teamData.maxMembers) {
        return { success: false, error: 'Team is at maximum capacity' };
      }

      const newMember: TeamMember = {
        agentId,
        roleId,
        name: agentData.name,
        joinedAt: new Date().toISOString(),
        permissions: this.getDefaultPermissions(roleId)
      };

      const updatedMembers = [...teamData.members, newMember];
      
      await updateDoc(doc(db, this.TEAMS_COLLECTION, teamId), {
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
        'metrics.averageTrustScore': this.calculateAverageTrustScore(updatedMembers)
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error adding agent to team:', error);
      return { success: false, error: 'Failed to add agent to team' };
    }
  }

  /**
   * Remove agent from team
   */
  static async removeAgentFromTeam(teamId: string, agentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const teamDoc = await getDoc(doc(db, this.TEAMS_COLLECTION, teamId));
      
      if (!teamDoc.exists()) {
        return { success: false, error: 'Team not found' };
      }

      const teamData = teamDoc.data() as Team;
      const updatedMembers = teamData.members.filter(member => member.agentId !== agentId);
      
      await updateDoc(doc(db, this.TEAMS_COLLECTION, teamId), {
        members: updatedMembers,
        updatedAt: new Date().toISOString(),
        'metrics.averageTrustScore': this.calculateAverageTrustScore(updatedMembers)
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error removing agent from team:', error);
      return { success: false, error: 'Failed to remove agent from team' };
    }
  }

  /**
   * Get team metrics
   */
  static async getTeamMetrics(teamId: string): Promise<any> {
    try {
      const teamDoc = await getDoc(doc(db, this.TEAMS_COLLECTION, teamId));
      
      if (teamDoc.exists()) {
        const teamData = teamDoc.data() as Team;
        return {
          teamId,
          ...teamData.metrics,
          lastUpdated: teamData.updatedAt
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching team metrics:', error);
      return null;
    }
  }

  /**
   * Get agent details
   */
  static async getAgentDetails(agentId: string): Promise<SimpleAgentConfig | null> {
    try {
      const agentDoc = await getDoc(doc(db, this.AGENTS_COLLECTION, agentId));
      
      if (agentDoc.exists()) {
        const data = agentDoc.data() as AgentConfiguration;
        return {
          id: agentDoc.id,
          name: data.name,
          description: data.description,
          agentType: data.agentType,
          apiEndpoint: data.apiEndpoint,
          governanceLevel: data.governanceLevel,
          trustScore: data.trustScore || 0,
          status: data.status,
          lastActivity: data.lastActivity
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching agent details:', error);
      return null;
    }
  }

  /**
   * Helper: Get default permissions for a role
   */
  private static getDefaultPermissions(roleId: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'leader': ['manage_team', 'assign_tasks', 'view_metrics', 'edit_settings'],
      'coordinator': ['assign_tasks', 'view_metrics', 'manage_members'],
      'member': ['view_team', 'participate'],
      'observer': ['view_team']
    };
    
    return rolePermissions[roleId] || rolePermissions['member'];
  }

  /**
   * Helper: Calculate average trust score for team members
   */
  private static calculateAverageTrustScore(members: TeamMember[]): number {
    if (members.length === 0) return 0;
    
    // This would need to fetch actual agent trust scores
    // For now, return a reasonable default
    return 85;
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

export default FirebaseTeamService;

