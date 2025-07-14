/**
 * System Status API Routes
 * Provides system health and status information
 */

const express = require('express');
const router = express.Router();
const sessionManager = require('../services/sessionManager');
const llmService = require('../services/llmService');

/**
 * GET /api/status
 * Get overall system status
 */
router.get('/', async (req, res) => {
  try {
    const sessionStats = sessionManager.getSessionStats();
    const llmStatus = await getLLMServiceStatus();
    
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        sessions: {
          status: 'healthy',
          stats: sessionStats
        },
        llm: llmStatus,
        database: {
          status: 'healthy', // In-memory for now
          type: 'in-memory'
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        }
      }
    };

    // Determine overall health
    const unhealthyServices = Object.values(systemStatus.services)
      .filter(service => service.status !== 'healthy');
    
    if (unhealthyServices.length > 0) {
      systemStatus.status = 'degraded';
    }

    res.json(systemStatus);

  } catch (error) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get system status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/status/health
 * Simple health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/status/sessions
 * Get session service status
 */
router.get('/sessions', async (req, res) => {
  try {
    const stats = sessionManager.getSessionStats();
    const activeSessions = sessionManager.getActiveSessions();

    res.json({
      status: 'healthy',
      stats: stats,
      activeSessions: activeSessions.length,
      recentSessions: activeSessions.slice(0, 5) // Last 5 sessions
    });

  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get session status',
      details: error.message
    });
  }
});

/**
 * GET /api/status/llm
 * Get LLM service status
 */
router.get('/llm', async (req, res) => {
  try {
    const llmStatus = await getLLMServiceStatus();
    res.json(llmStatus);

  } catch (error) {
    console.error('Error getting LLM status:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to get LLM status',
      details: error.message
    });
  }
});

/**
 * GET /api/status/metrics
 * Get system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const sessionStats = sessionManager.getSessionStats();
    const memoryUsage = process.memoryUsage();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      sessions: sessionStats,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage()
      },
      process: {
        pid: process.pid,
        version: process.version,
        platform: process.platform
      }
    };

    res.json(metrics);

  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({
      error: 'Failed to get metrics',
      details: error.message
    });
  }
});

/**
 * Helper function to get LLM service status
 */
async function getLLMServiceStatus() {
  try {
    // Check which LLM providers are available
    const providers = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      huggingface: !!process.env.HUGGINGFACE_API_KEY
    };

    const availableProviders = Object.entries(providers)
      .filter(([_, available]) => available)
      .map(([provider, _]) => provider);

    return {
      status: availableProviders.length > 0 ? 'healthy' : 'degraded',
      providers: providers,
      availableProviders: availableProviders,
      defaultProvider: availableProviders[0] || 'none'
    };

  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      providers: {},
      availableProviders: [],
      defaultProvider: 'none'
    };
  }
}

module.exports = router;

