const express = require('express');
const router = express.Router();

/**
 * Team Management API Routes
 * 
 * These routes extend the existing agent system to support multi-agent teams
 * while maintaining full backward compatibility with individual agent management.
 * 
 * All team operations work with existing AgentConfiguration objects from Firebase.
 */

/**
 * GET /api/teams
 * 
 * Get all teams for the authenticated user
 * 
 * Response:
 * {
 *   "teams": [
 *     {
 *       "id": "team-123",
 *       "name": "Content Creation Team",
 *       "description": "Team for content creation workflows",
 *       "ownerId": "user-456",
 *       "teamType": "specialized",
 *       "status": "active",
 *       "memberCount": 3,
 *       "metrics": {...}
 *     }
 *   ]
 * }
 */
router.get('/teams', async (req, res) => {
  try {
    // TODO: Get userId from authentication middleware
    const userId = req.user?.uid || 'demo-user';

    // Import team service
    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Get user's teams
    const teams = await teamService.getUserTeams(userId);

    res.json({
      teams: teams,
      count: teams.length
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/teams
 * 
 * Create a new agent team
 * 
 * Request Body:
 * {
 *   "name": "Content Creation Team",
 *   "description": "Team for content creation workflows",
 *   "teamType": "collaborative|hierarchical|specialized|custom",
 *   "maxMembers": 5,
 *   "governancePolicy": {...},
 *   "roles": [...],
 *   "initialMembers": [
 *     {
 *       "agentId": "agent-123",
 *       "roleId": "role-456"
 *     }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "teamId": "team-789",
 *   "status": "created",
 *   "team": {...}
 * }
 */
router.post('/teams', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const teamData = req.body;

    // Validate required fields
    if (!teamData.name || !teamData.teamType) {
      return res.status(400).json({
        error: 'Missing required fields: name and teamType'
      });
    }

    // Import team service
    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Validate that all specified agents exist and belong to the user
    if (teamData.initialMembers && teamData.initialMembers.length > 0) {
      const agentIds = teamData.initialMembers.map(member => member.agentId);
      const validAgents = await teamService.validateUserAgents(userId, agentIds);
      
      if (validAgents.length !== agentIds.length) {
        return res.status(400).json({
          error: 'One or more specified agents do not exist or do not belong to the user'
        });
      }
    }

    // Create the team
    const team = await teamService.createTeam(userId, teamData);

    res.status(201).json({
      teamId: team.id,
      status: 'created',
      team: team
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/teams/:teamId
 * 
 * Get detailed information about a specific team
 * 
 * Response:
 * {
 *   "team": {
 *     "id": "team-123",
 *     "name": "Content Creation Team",
 *     "members": [...],
 *     "roles": [...],
 *     "workflows": [...],
 *     "metrics": {...},
 *     "activity": [...]
 *   }
 * }
 */
router.get('/teams/:teamId', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Get team details with permission check
    const team = await teamService.getTeamDetails(teamId, userId);

    if (!team) {
      return res.status(404).json({
        error: 'Team not found or access denied'
      });
    }

    res.json({
      team: team
    });

  } catch (error) {
    console.error('Get team details error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * PUT /api/teams/:teamId
 * 
 * Update team configuration
 * 
 * Request Body:
 * {
 *   "name": "Updated Team Name",
 *   "description": "Updated description",
 *   "governancePolicy": {...},
 *   "maxMembers": 10
 * }
 */
router.put('/teams/:teamId', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;
    const updates = req.body;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Update team with permission check
    const updatedTeam = await teamService.updateTeam(teamId, userId, updates);

    if (!updatedTeam) {
      return res.status(404).json({
        error: 'Team not found or access denied'
      });
    }

    res.json({
      status: 'updated',
      team: updatedTeam
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/teams/:teamId/members
 * 
 * Add agent to team
 * 
 * Request Body:
 * {
 *   "agentId": "agent-123",
 *   "roleId": "role-456"
 * }
 */
router.post('/teams/:teamId/members', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;
    const { agentId, roleId } = req.body;

    if (!agentId || !roleId) {
      return res.status(400).json({
        error: 'Missing required fields: agentId and roleId'
      });
    }

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Add member with validation
    const result = await teamService.addTeamMember(teamId, userId, agentId, roleId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    res.json({
      status: 'member_added',
      member: result.member
    });

  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/teams/:teamId/members/:agentId
 * 
 * Remove agent from team
 */
router.delete('/teams/:teamId/members/:agentId', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId, agentId } = req.params;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Remove member with permission check
    const result = await teamService.removeTeamMember(teamId, userId, agentId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    res.json({
      status: 'member_removed'
    });

  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/teams/:teamId/metrics
 * 
 * Get team performance metrics
 * 
 * Response:
 * {
 *   "metrics": {
 *     "averageTeamTrustScore": 87,
 *     "totalTeamInteractions": 1250,
 *     "teamViolationRate": 2.3,
 *     "collaborationEfficiency": 92,
 *     "governanceCompliance": 96
 *   },
 *   "trends": {...},
 *   "memberMetrics": [...]
 * }
 */
router.get('/teams/:teamId/metrics', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Get team metrics with permission check
    const metrics = await teamService.getTeamMetrics(teamId, userId);

    if (!metrics) {
      return res.status(404).json({
        error: 'Team not found or access denied'
      });
    }

    res.json({
      metrics: metrics
    });

  } catch (error) {
    console.error('Get team metrics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/teams/:teamId/activity
 * 
 * Get team activity log
 * 
 * Query Parameters:
 * - limit: Number of activities to return (default: 50)
 * - offset: Offset for pagination (default: 0)
 * - type: Filter by activity type
 * 
 * Response:
 * {
 *   "activities": [...],
 *   "total": 150,
 *   "hasMore": true
 * }
 */
router.get('/teams/:teamId/activity', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;
    const { limit = 50, offset = 0, type } = req.query;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Get team activity with permission check
    const activity = await teamService.getTeamActivity(teamId, userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type: type
    });

    if (!activity) {
      return res.status(404).json({
        error: 'Team not found or access denied'
      });
    }

    res.json(activity);

  } catch (error) {
    console.error('Get team activity error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/teams/:teamId
 * 
 * Delete team (only team owner can delete)
 */
router.delete('/teams/:teamId', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { teamId } = req.params;

    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Delete team with permission check
    const result = await teamService.deleteTeam(teamId, userId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    res.json({
      status: 'team_deleted'
    });

  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

