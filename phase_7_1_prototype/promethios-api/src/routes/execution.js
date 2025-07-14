/**
 * Execution API Routes
 * Handles system execution, monitoring, and deployment operations
 */

const express = require('express');
const router = express.Router();
const executionService = require('../services/executionService');

/**
 * POST /api/execution/execute
 * Execute a system operation
 */
router.post('/execute', async (req, res) => {
  try {
    const { operationType, parameters = {}, userId = 'anonymous' } = req.body;

    if (!operationType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: operationType'
      });
    }

    const result = await executionService.execute(operationType, parameters, userId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error executing operation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute operation',
      details: error.message
    });
  }
});

/**
 * GET /api/execution/:executionId
 * Get execution status
 */
router.get('/:executionId', async (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = executionService.getExecution(executionId);

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      execution: execution
    });

  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get execution',
      details: error.message
    });
  }
});

/**
 * GET /api/execution
 * List executions with filters
 */
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      operationType: req.query.operationType,
      userId: req.query.userId
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const executions = executionService.listExecutions(filters);
    const stats = executionService.getExecutionStats();

    res.json({
      success: true,
      executions: executions,
      stats: stats
    });

  } catch (error) {
    console.error('Error listing executions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list executions',
      details: error.message
    });
  }
});

/**
 * GET /api/execution/deployments/:deploymentId
 * Get deployment status
 */
router.get('/deployments/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    const deployment = executionService.getDeployment(deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: 'Deployment not found'
      });
    }

    res.json({
      success: true,
      deployment: deployment
    });

  } catch (error) {
    console.error('Error getting deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deployment',
      details: error.message
    });
  }
});

/**
 * GET /api/execution/deployments
 * List deployments with filters
 */
router.get('/deployments', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      agentId: req.query.agentId,
      environment: req.query.environment
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });

    const deployments = executionService.listDeployments(filters);

    res.json({
      success: true,
      deployments: deployments
    });

  } catch (error) {
    console.error('Error listing deployments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list deployments',
      details: error.message
    });
  }
});

/**
 * GET /api/execution/metrics
 * Get system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '1h';
    const metrics = executionService.getSystemMetrics(timeRange);

    res.json({
      success: true,
      metrics: metrics,
      timeRange: timeRange
    });

  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

/**
 * POST /api/execution/deploy
 * Deploy an agent (convenience endpoint)
 */
router.post('/deploy', async (req, res) => {
  try {
    const { agentId, deploymentConfig, targetEnvironment, userId = 'anonymous' } = req.body;

    if (!agentId || !targetEnvironment) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId, targetEnvironment'
      });
    }

    const result = await executionService.execute('deploy_agent', {
      agentId,
      deploymentConfig: deploymentConfig || {},
      targetEnvironment
    }, userId);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error deploying agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy agent',
      details: error.message
    });
  }
});

/**
 * POST /api/execution/health-check
 * Run system health check (convenience endpoint)
 */
router.post('/health-check', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;

    const result = await executionService.execute('system_health_check', {}, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error running health check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run health check',
      details: error.message
    });
  }
});

/**
 * POST /api/execution/governance-check
 * Run governance check (convenience endpoint)
 */
router.post('/governance-check', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;

    const result = await executionService.execute('governance_check', {}, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Error running governance check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run governance check',
      details: error.message
    });
  }
});

module.exports = router;

