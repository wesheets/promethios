const express = require('express');
const router = express.Router();

/**
 * Deploy Management API Routes
 * 
 * These routes handle agent and team deployment functionality,
 * including package generation, deployment monitoring, and export capabilities.
 */

/**
 * GET /api/deploy/agents
 * 
 * Get deployable agents for the authenticated user
 * 
 * Response:
 * {
 *   "agents": [
 *     {
 *       "id": "agent-123",
 *       "name": "Research Assistant",
 *       "trustScore": 87,
 *       "governanceLevel": "standard",
 *       "deploymentStatus": "ready|deployed|pending",
 *       "lastDeployment": "2025-06-09T..."
 *     }
 *   ]
 * }
 */
router.get('/deploy/agents', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';

    // Import services
    const AgentWrapperService = require('../services/agentWrapperService');
    const GovernanceIdentityService = require('../services/governanceIdentityService');

    // Get user's agents with governance identities
    const agentWrapper = new AgentWrapperService();
    const governanceIdentity = new GovernanceIdentityService();

    // Demo data for deployable agents
    const deployableAgents = [
      {
        id: 'agent-1',
        name: 'Research Assistant',
        description: 'AI agent specialized in research and fact-checking',
        trustScore: 87,
        governanceLevel: 'standard',
        deploymentStatus: 'ready',
        lastDeployment: null,
        governanceIdentity: await governanceIdentity.getGovernanceIdentity('agent-1'),
        supportedFormats: ['docker', 'lambda', 'api', 'sdk']
      },
      {
        id: 'agent-2',
        name: 'Content Creator',
        description: 'AI agent for content creation and writing',
        trustScore: 82,
        governanceLevel: 'basic',
        deploymentStatus: 'deployed',
        lastDeployment: new Date(Date.now() - 86400000).toISOString(),
        governanceIdentity: await governanceIdentity.getGovernanceIdentity('agent-2'),
        supportedFormats: ['docker', 'api']
      }
    ];

    res.json({
      agents: deployableAgents,
      count: deployableAgents.length
    });

  } catch (error) {
    console.error('Get deployable agents error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/deploy/teams
 * 
 * Get deployable teams for the authenticated user
 * 
 * Response:
 * {
 *   "teams": [
 *     {
 *       "id": "team-123",
 *       "name": "Content Creation Team",
 *       "memberCount": 3,
 *       "averageTrustScore": 85,
 *       "deploymentStatus": "ready|deployed|pending",
 *       "supportedFormats": ["orchestrator", "microservices", "container-group"]
 *     }
 *   ]
 * }
 */
router.get('/deploy/teams', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';

    // Import team service
    const TeamService = require('../services/teamService');
    const teamService = new TeamService();

    // Get user's teams
    const teams = await teamService.getUserTeams(userId);

    // Add deployment information
    const deployableTeams = teams.map(team => ({
      ...team,
      deploymentStatus: 'ready',
      lastDeployment: null,
      supportedFormats: ['orchestrator', 'microservices', 'container-group'],
      governanceCompliance: 95 // Team-level governance compliance
    }));

    res.json({
      teams: deployableTeams,
      count: deployableTeams.length
    });

  } catch (error) {
    console.error('Get deployable teams error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/deploy/generate
 * 
 * Generate deployment package for agent or team
 * 
 * Request Body:
 * {
 *   "type": "agent|team",
 *   "id": "agent-123|team-456",
 *   "format": "docker|lambda|api|sdk|orchestrator|microservices",
 *   "options": {
 *     "includeGovernance": true,
 *     "governanceLevel": "basic|standard|strict|maximum",
 *     "includeObserver": true,
 *     "includeScorecard": true
 *   }
 * }
 * 
 * Response:
 * {
 *   "packageId": "pkg-789",
 *   "downloadUrl": "/api/deploy/download/pkg-789",
 *   "format": "docker",
 *   "size": "45.2 MB",
 *   "expiresAt": "2025-06-10T...",
 *   "instructions": "..."
 * }
 */
router.post('/deploy/generate', async (req, res) => {
  try {
    const userId = req.user?.uid || 'demo-user';
    const { type, id, format, options = {} } = req.body;

    // Validate required fields
    if (!type || !id || !format) {
      return res.status(400).json({
        error: 'Missing required fields: type, id, and format'
      });
    }

    // Validate type and format
    const validTypes = ['agent', 'team'];
    const validFormats = ['docker', 'lambda', 'api', 'sdk', 'orchestrator', 'microservices'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be: ' + validTypes.join(', ')
      });
    }
    
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        error: 'Invalid format. Must be: ' + validFormats.join(', ')
      });
    }

    // Generate package ID
    const packageId = `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Import deployment service
    const DeploymentService = require('../services/deploymentService');
    const deploymentService = new DeploymentService();

    // Generate deployment package
    const packageInfo = await deploymentService.generatePackage({
      packageId,
      userId,
      type,
      entityId: id,
      format,
      options
    });

    res.json({
      packageId: packageInfo.packageId,
      downloadUrl: `/api/deploy/download/${packageInfo.packageId}`,
      format: packageInfo.format,
      size: packageInfo.size,
      expiresAt: packageInfo.expiresAt,
      instructions: packageInfo.instructions,
      governanceIncluded: options.includeGovernance !== false,
      observerIncluded: options.includeObserver !== false
    });

  } catch (error) {
    console.error('Generate deployment package error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/deploy/download/:packageId
 * 
 * Download generated deployment package
 */
router.get('/deploy/download/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const userId = req.user?.uid || 'demo-user';

    // Import deployment service
    const DeploymentService = require('../services/deploymentService');
    const deploymentService = new DeploymentService();

    // Get package info and validate access
    const packageInfo = await deploymentService.getPackageInfo(packageId, userId);

    if (!packageInfo) {
      return res.status(404).json({
        error: 'Package not found or access denied'
      });
    }

    if (new Date() > new Date(packageInfo.expiresAt)) {
      return res.status(410).json({
        error: 'Package has expired'
      });
    }

    // For demo purposes, return package metadata
    // In production, this would stream the actual package file
    res.json({
      packageId: packageInfo.packageId,
      format: packageInfo.format,
      size: packageInfo.size,
      downloadReady: true,
      message: 'Package ready for download',
      // In production, this would be a file stream
      mockDownload: {
        filename: `${packageInfo.entityName}_${packageInfo.format}_${packageInfo.packageId}.zip`,
        contentType: 'application/zip',
        note: 'This is a demo response. In production, this would stream the actual deployment package.'
      }
    });

  } catch (error) {
    console.error('Download package error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/deploy/status/:packageId
 * 
 * Get deployment package generation status
 * 
 * Response:
 * {
 *   "status": "generating|ready|failed|expired",
 *   "progress": 75,
 *   "message": "Generating Docker container...",
 *   "estimatedCompletion": "2025-06-09T..."
 * }
 */
router.get('/deploy/status/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const userId = req.user?.uid || 'demo-user';

    // Import deployment service
    const DeploymentService = require('../services/deploymentService');
    const deploymentService = new DeploymentService();

    // Get package status
    const status = await deploymentService.getPackageStatus(packageId, userId);

    if (!status) {
      return res.status(404).json({
        error: 'Package not found or access denied'
      });
    }

    res.json(status);

  } catch (error) {
    console.error('Get package status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/deploy/packages/:packageId
 * 
 * Delete deployment package
 */
router.delete('/deploy/packages/:packageId', async (req, res) => {
  try {
    const { packageId } = req.params;
    const userId = req.user?.uid || 'demo-user';

    // Import deployment service
    const DeploymentService = require('../services/deploymentService');
    const deploymentService = new DeploymentService();

    // Delete package
    const result = await deploymentService.deletePackage(packageId, userId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error
      });
    }

    res.json({
      status: 'package_deleted'
    });

  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/deploy/formats
 * 
 * Get available deployment formats and their capabilities
 * 
 * Response:
 * {
 *   "formats": [
 *     {
 *       "id": "docker",
 *       "name": "Docker Container",
 *       "description": "Self-contained governed agent",
 *       "complexity": "beginner",
 *       "supportedTypes": ["agent", "team"],
 *       "features": ["governance", "observer", "scorecard"]
 *     }
 *   ]
 * }
 */
router.get('/deploy/formats', async (req, res) => {
  try {
    const formats = [
      {
        id: 'docker',
        name: 'Docker Container',
        description: 'Self-contained governed agent with all dependencies',
        complexity: 'beginner',
        supportedTypes: ['agent', 'team'],
        features: ['governance', 'observer', 'scorecard', 'monitoring'],
        estimatedSize: '150-300 MB',
        deploymentTime: '2-5 minutes'
      },
      {
        id: 'lambda',
        name: 'AWS Lambda',
        description: 'Serverless deployment package for AWS Lambda',
        complexity: 'intermediate',
        supportedTypes: ['agent'],
        features: ['governance', 'scorecard'],
        estimatedSize: '50-100 MB',
        deploymentTime: '1-3 minutes'
      },
      {
        id: 'api',
        name: 'REST API Service',
        description: 'Standalone API service with governance middleware',
        complexity: 'intermediate',
        supportedTypes: ['agent', 'team'],
        features: ['governance', 'observer', 'scorecard', 'monitoring', 'webhooks'],
        estimatedSize: '100-200 MB',
        deploymentTime: '3-7 minutes'
      },
      {
        id: 'sdk',
        name: 'Governance SDK',
        description: 'Embeddable library for custom integration',
        complexity: 'advanced',
        supportedTypes: ['agent'],
        features: ['governance', 'scorecard'],
        estimatedSize: '10-25 MB',
        deploymentTime: '1-2 minutes'
      },
      {
        id: 'orchestrator',
        name: 'Team Orchestrator',
        description: 'Multi-agent workflow orchestration service',
        complexity: 'advanced',
        supportedTypes: ['team'],
        features: ['governance', 'observer', 'scorecard', 'workflow', 'monitoring'],
        estimatedSize: '200-400 MB',
        deploymentTime: '5-10 minutes'
      },
      {
        id: 'microservices',
        name: 'Microservices Architecture',
        description: 'Distributed team deployment with individual agent services',
        complexity: 'expert',
        supportedTypes: ['team'],
        features: ['governance', 'observer', 'scorecard', 'workflow', 'monitoring', 'scaling'],
        estimatedSize: '300-600 MB',
        deploymentTime: '10-15 minutes'
      }
    ];

    res.json({
      formats: formats,
      count: formats.length
    });

  } catch (error) {
    console.error('Get deployment formats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

