/**
 * Team Service
 * 
 * This service manages multi-agent teams while maintaining full backward compatibility
 * with the existing AgentFirebaseService. It extends individual agent management
 * to support team-based workflows and governance.
 * 
 * Key Design Principles:
 * - Uses existing AgentConfiguration objects from Firebase
 * - No breaking changes to individual agent functionality
 * - Teams are overlays on top of existing agents
 * - Maintains all existing governance and identity features
 */

const { v4: uuidv4 } = require('uuid');

class TeamService {
  constructor() {
    this.teams = new Map(); // In-memory storage for demo (would use Firebase in production)
    this.teamActivity = new Map(); // Activity logs per team
    this.initializeDemoData();
  }

  /**
   * Initialize demo data for testing
   */
  initializeDemoData() {
    // Demo team for testing
    const demoTeam = {
      id: 'demo-team-1',
      name: 'Content Creation Team',
      description: 'Specialized team for content creation and review workflows',
      ownerId: 'demo-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      teamType: 'specialized',
      maxMembers: 5,
      governancePolicy: {
        inheritFromMembers: false,
        overrideLevel: 'strict',
        requireConsensus: true,
        escalationRules: {
          trustThreshold: 85,
          violationLimit: 1,
          timeoutMinutes: 10
        }
      },
      roles: [
        {
          id: 'role-research',
          name: 'Research Specialist',
          description: 'Agent specialized in research and data analysis',
          capabilities: ['research', 'analyze', 'fact_check'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: false,
            canAccessSensitiveData: true,
            canOverrideDecisions: false
          },
          governanceLevel: 'strict',
          trustRequirement: 85
        },
        {
          id: 'role-content',
          name: 'Content Creator',
          description: 'Agent specialized in content creation and writing',
          capabilities: ['create', 'edit', 'format'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: false,
            canAccessSensitiveData: false,
            canOverrideDecisions: false
          },
          governanceLevel: 'standard',
          trustRequirement: 80
        },
        {
          id: 'role-reviewer',
          name: 'Quality Reviewer',
          description: 'Agent specialized in quality assurance and review',
          capabilities: ['review', 'approve', 'quality_check'],
          permissions: {
            canInitiateWorkflow: false,
            canModifyGovernance: false,
            canAccessSensitiveData: true,
            canOverrideDecisions: true
          },
          governanceLevel: 'maximum',
          trustRequirement: 95
        }
      ],
      members: [],
      workflows: [],
      metrics: {
        averageTeamTrustScore: 0,
        totalTeamInteractions: 0,
        teamViolationRate: 0,
        collaborationEfficiency: 0,
        governanceCompliance: 100
      }
    };

    this.teams.set(demoTeam.id, demoTeam);
    this.teamActivity.set(demoTeam.id, []);
  }

  /**
   * Get all teams for a user
   * 
   * @param {string} userId - User ID
   * @returns {Array} Array of team summaries
   */
  async getUserTeams(userId) {
    try {
      const userTeams = [];
      
      for (const [teamId, team] of this.teams) {
        if (team.ownerId === userId) {
          // Return summary view for list
          userTeams.push({
            id: team.id,
            name: team.name,
            description: team.description,
            teamType: team.teamType,
            status: team.status,
            memberCount: team.members.length,
            createdAt: team.createdAt,
            metrics: {
              averageTeamTrustScore: team.metrics.averageTeamTrustScore,
              collaborationEfficiency: team.metrics.collaborationEfficiency
            }
          });
        }
      }

      return userTeams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  /**
   * Create a new team
   * 
   * @param {string} userId - User ID (team owner)
   * @param {Object} teamData - Team configuration data
   * @returns {Object} Created team
   */
  async createTeam(userId, teamData) {
    try {
      const teamId = uuidv4();
      const now = new Date().toISOString();

      const team = {
        id: teamId,
        name: teamData.name,
        description: teamData.description || '',
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        teamType: teamData.teamType,
        maxMembers: teamData.maxMembers || 10,
        governancePolicy: teamData.governancePolicy || this.getDefaultGovernancePolicy(teamData.teamType),
        roles: teamData.roles || this.getDefaultRoles(teamData.teamType),
        members: [],
        workflows: [],
        metrics: {
          averageTeamTrustScore: 0,
          totalTeamInteractions: 0,
          teamViolationRate: 0,
          collaborationEfficiency: 0,
          governanceCompliance: 100
        }
      };

      // Add initial members if specified
      if (teamData.initialMembers && teamData.initialMembers.length > 0) {
        for (const memberData of teamData.initialMembers) {
          const member = {
            agentId: memberData.agentId,
            roleId: memberData.roleId,
            joinedAt: now,
            status: 'active',
            performanceMetrics: {
              averageTrustScore: 85, // Default, will be updated from actual agent data
              totalInteractions: 0,
              violationCount: 0,
              lastActivity: now
            },
            specializations: memberData.specializations || []
          };
          team.members.push(member);
        }
      }

      // Store team
      this.teams.set(teamId, team);
      this.teamActivity.set(teamId, []);

      // Log team creation activity
      await this.logTeamActivity(teamId, {
        activityType: 'team_created',
        actorId: userId,
        description: `Team "${team.name}" created`,
        severity: 'info'
      });

      console.log(`✅ Team created: ${team.name} (${teamId})`);
      return team;

    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Get detailed team information
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (for permission check)
   * @returns {Object|null} Team details or null if not found/no access
   */
  async getTeamDetails(teamId, userId) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return null;
      }

      // Check if user has access (owner or team member)
      const hasAccess = team.ownerId === userId || 
                       team.members.some(member => member.agentId.includes(userId));

      if (!hasAccess) {
        return null;
      }

      // Get recent activity
      const recentActivity = this.teamActivity.get(teamId)?.slice(-10) || [];

      return {
        ...team,
        recentActivity: recentActivity
      };

    } catch (error) {
      console.error('Error getting team details:', error);
      return null;
    }
  }

  /**
   * Update team configuration
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (must be team owner)
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated team or null if not found/no access
   */
  async updateTeam(teamId, userId, updates) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team || team.ownerId !== userId) {
        return null;
      }

      // Apply updates
      const updatedTeam = {
        ...team,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.teams.set(teamId, updatedTeam);

      // Log update activity
      await this.logTeamActivity(teamId, {
        activityType: 'team_updated',
        actorId: userId,
        description: `Team configuration updated`,
        severity: 'info'
      });

      return updatedTeam;

    } catch (error) {
      console.error('Error updating team:', error);
      return null;
    }
  }

  /**
   * Add agent to team
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (must be team owner)
   * @param {string} agentId - Agent ID to add
   * @param {string} roleId - Role ID to assign
   * @returns {Object} Result with success status
   */
  async addTeamMember(teamId, userId, agentId, roleId) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team || team.ownerId !== userId) {
        return { success: false, error: 'Team not found or access denied' };
      }

      // Check if agent is already a member
      if (team.members.some(member => member.agentId === agentId)) {
        return { success: false, error: 'Agent is already a team member' };
      }

      // Check if role exists
      if (!team.roles.some(role => role.id === roleId)) {
        return { success: false, error: 'Role not found' };
      }

      // Check team capacity
      if (team.members.length >= team.maxMembers) {
        return { success: false, error: 'Team is at maximum capacity' };
      }

      // Create member object
      const member = {
        agentId: agentId,
        roleId: roleId,
        joinedAt: new Date().toISOString(),
        status: 'active',
        performanceMetrics: {
          averageTrustScore: 85, // Will be updated from actual agent data
          totalInteractions: 0,
          violationCount: 0,
          lastActivity: new Date().toISOString()
        },
        specializations: []
      };

      // Add member to team
      team.members.push(member);
      team.updatedAt = new Date().toISOString();

      // Update team metrics
      await this.updateTeamMetrics(teamId);

      // Log activity
      await this.logTeamActivity(teamId, {
        activityType: 'member_joined',
        actorId: userId,
        targetId: agentId,
        description: `Agent ${agentId} joined the team`,
        severity: 'info'
      });

      return { success: true, member: member };

    } catch (error) {
      console.error('Error adding team member:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Remove agent from team
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (must be team owner)
   * @param {string} agentId - Agent ID to remove
   * @returns {Object} Result with success status
   */
  async removeTeamMember(teamId, userId, agentId) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team || team.ownerId !== userId) {
        return { success: false, error: 'Team not found or access denied' };
      }

      // Find and remove member
      const memberIndex = team.members.findIndex(member => member.agentId === agentId);
      
      if (memberIndex === -1) {
        return { success: false, error: 'Agent is not a team member' };
      }

      team.members.splice(memberIndex, 1);
      team.updatedAt = new Date().toISOString();

      // Update team metrics
      await this.updateTeamMetrics(teamId);

      // Log activity
      await this.logTeamActivity(teamId, {
        activityType: 'member_left',
        actorId: userId,
        targetId: agentId,
        description: `Agent ${agentId} left the team`,
        severity: 'info'
      });

      return { success: true };

    } catch (error) {
      console.error('Error removing team member:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get team metrics
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (for permission check)
   * @returns {Object|null} Team metrics or null if not found/no access
   */
  async getTeamMetrics(teamId, userId) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return null;
      }

      // Check access
      const hasAccess = team.ownerId === userId || 
                       team.members.some(member => member.agentId.includes(userId));

      if (!hasAccess) {
        return null;
      }

      // Calculate current metrics
      await this.updateTeamMetrics(teamId);

      return {
        current: team.metrics,
        trends: {
          trustScoreTrend: 'stable', // Would calculate from historical data
          violationTrend: 'improving',
          efficiencyTrend: 'improving'
        },
        memberMetrics: team.members.map(member => ({
          agentId: member.agentId,
          roleId: member.roleId,
          performanceMetrics: member.performanceMetrics
        }))
      };

    } catch (error) {
      console.error('Error getting team metrics:', error);
      return null;
    }
  }

  /**
   * Get team activity log
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (for permission check)
   * @param {Object} options - Query options (limit, offset, type)
   * @returns {Object|null} Activity data or null if not found/no access
   */
  async getTeamActivity(teamId, userId, options = {}) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team) {
        return null;
      }

      // Check access
      const hasAccess = team.ownerId === userId || 
                       team.members.some(member => member.agentId.includes(userId));

      if (!hasAccess) {
        return null;
      }

      const activities = this.teamActivity.get(teamId) || [];
      const { limit = 50, offset = 0, type } = options;

      // Filter by type if specified
      let filteredActivities = activities;
      if (type) {
        filteredActivities = activities.filter(activity => activity.activityType === type);
      }

      // Apply pagination
      const paginatedActivities = filteredActivities
        .slice(offset, offset + limit)
        .reverse(); // Most recent first

      return {
        activities: paginatedActivities,
        total: filteredActivities.length,
        hasMore: offset + limit < filteredActivities.length
      };

    } catch (error) {
      console.error('Error getting team activity:', error);
      return null;
    }
  }

  /**
   * Delete team
   * 
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID (must be team owner)
   * @returns {Object} Result with success status
   */
  async deleteTeam(teamId, userId) {
    try {
      const team = this.teams.get(teamId);
      
      if (!team || team.ownerId !== userId) {
        return { success: false, error: 'Team not found or access denied' };
      }

      // Remove team and activity
      this.teams.delete(teamId);
      this.teamActivity.delete(teamId);

      console.log(`🗑️ Team deleted: ${team.name} (${teamId})`);
      return { success: true };

    } catch (error) {
      console.error('Error deleting team:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Validate that agents exist and belong to user
   * 
   * @param {string} userId - User ID
   * @param {Array} agentIds - Array of agent IDs to validate
   * @returns {Array} Array of valid agent IDs
   */
  async validateUserAgents(userId, agentIds) {
    try {
      // In a real implementation, this would query Firebase to validate agents
      // For demo purposes, we'll assume all provided agent IDs are valid
      return agentIds;
    } catch (error) {
      console.error('Error validating user agents:', error);
      return [];
    }
  }

  /**
   * Update team metrics based on current member performance
   * 
   * @param {string} teamId - Team ID
   */
  async updateTeamMetrics(teamId) {
    try {
      const team = this.teams.get(teamId);
      if (!team) return;

      const members = team.members;
      
      if (members.length === 0) {
        team.metrics = {
          averageTeamTrustScore: 0,
          totalTeamInteractions: 0,
          teamViolationRate: 0,
          collaborationEfficiency: 0,
          governanceCompliance: 100
        };
        return;
      }

      // Calculate average trust score
      const totalTrust = members.reduce((sum, member) => 
        sum + member.performanceMetrics.averageTrustScore, 0
      );
      const averageTeamTrustScore = Math.round(totalTrust / members.length);

      // Calculate total interactions
      const totalTeamInteractions = members.reduce((sum, member) => 
        sum + member.performanceMetrics.totalInteractions, 0
      );

      // Calculate violation rate
      const totalViolations = members.reduce((sum, member) => 
        sum + member.performanceMetrics.violationCount, 0
      );
      const teamViolationRate = totalTeamInteractions > 0 ? 
        (totalViolations / totalTeamInteractions) * 100 : 0;

      // Calculate collaboration efficiency (simplified)
      const collaborationEfficiency = Math.max(0, 
        Math.round(averageTeamTrustScore * 0.8 + (100 - teamViolationRate) * 0.2)
      );

      // Calculate governance compliance
      const governanceCompliance = Math.max(0, Math.round(100 - teamViolationRate));

      team.metrics = {
        averageTeamTrustScore,
        totalTeamInteractions,
        teamViolationRate: Math.round(teamViolationRate * 100) / 100,
        collaborationEfficiency,
        governanceCompliance
      };

    } catch (error) {
      console.error('Error updating team metrics:', error);
    }
  }

  /**
   * Log team activity
   * 
   * @param {string} teamId - Team ID
   * @param {Object} activityData - Activity data
   */
  async logTeamActivity(teamId, activityData) {
    try {
      const activity = {
        id: uuidv4(),
        teamId: teamId,
        timestamp: new Date().toISOString(),
        ...activityData
      };

      const activities = this.teamActivity.get(teamId) || [];
      activities.push(activity);
      
      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }
      
      this.teamActivity.set(teamId, activities);

    } catch (error) {
      console.error('Error logging team activity:', error);
    }
  }

  /**
   * Get default governance policy for team type
   * 
   * @param {string} teamType - Team type
   * @returns {Object} Default governance policy
   */
  getDefaultGovernancePolicy(teamType) {
    const policies = {
      collaborative: {
        inheritFromMembers: true,
        requireConsensus: true,
        escalationRules: {
          trustThreshold: 70,
          violationLimit: 3,
          timeoutMinutes: 30
        }
      },
      hierarchical: {
        inheritFromMembers: false,
        overrideLevel: 'strict',
        requireConsensus: false,
        escalationRules: {
          trustThreshold: 80,
          violationLimit: 2,
          timeoutMinutes: 15
        }
      },
      specialized: {
        inheritFromMembers: false,
        overrideLevel: 'strict',
        requireConsensus: true,
        escalationRules: {
          trustThreshold: 85,
          violationLimit: 1,
          timeoutMinutes: 10
        }
      }
    };

    return policies[teamType] || policies.collaborative;
  }

  /**
   * Get default roles for team type
   * 
   * @param {string} teamType - Team type
   * @returns {Array} Default roles
   */
  getDefaultRoles(teamType) {
    const roleTemplates = {
      collaborative: [
        {
          id: 'role-member',
          name: 'Team Member',
          description: 'Standard team member with collaborative permissions',
          capabilities: ['chat', 'analyze', 'research', 'create'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: false,
            canAccessSensitiveData: false,
            canOverrideDecisions: false
          },
          governanceLevel: 'standard',
          trustRequirement: 75
        }
      ],
      hierarchical: [
        {
          id: 'role-lead',
          name: 'Team Lead',
          description: 'Senior agent with oversight and approval authority',
          capabilities: ['chat', 'analyze', 'research', 'create', 'approve', 'escalate'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: true,
            canAccessSensitiveData: true,
            canOverrideDecisions: true
          },
          governanceLevel: 'strict',
          trustRequirement: 90
        },
        {
          id: 'role-member',
          name: 'Team Member',
          description: 'Standard team member reporting to team lead',
          capabilities: ['chat', 'analyze', 'research', 'create'],
          permissions: {
            canInitiateWorkflow: false,
            canModifyGovernance: false,
            canAccessSensitiveData: false,
            canOverrideDecisions: false
          },
          governanceLevel: 'standard',
          trustRequirement: 75
        }
      ],
      specialized: [
        {
          id: 'role-research',
          name: 'Research Specialist',
          description: 'Agent specialized in research and data analysis',
          capabilities: ['research', 'analyze', 'fact_check'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: false,
            canAccessSensitiveData: true,
            canOverrideDecisions: false
          },
          governanceLevel: 'strict',
          trustRequirement: 85
        },
        {
          id: 'role-content',
          name: 'Content Creator',
          description: 'Agent specialized in content creation and writing',
          capabilities: ['create', 'edit', 'format'],
          permissions: {
            canInitiateWorkflow: true,
            canModifyGovernance: false,
            canAccessSensitiveData: false,
            canOverrideDecisions: false
          },
          governanceLevel: 'standard',
          trustRequirement: 80
        },
        {
          id: 'role-reviewer',
          name: 'Quality Reviewer',
          description: 'Agent specialized in quality assurance and review',
          capabilities: ['review', 'approve', 'quality_check'],
          permissions: {
            canInitiateWorkflow: false,
            canModifyGovernance: false,
            canAccessSensitiveData: true,
            canOverrideDecisions: true
          },
          governanceLevel: 'maximum',
          trustRequirement: 95
        }
      ]
    };

    return roleTemplates[teamType] || roleTemplates.collaborative;
  }
}

module.exports = TeamService;

