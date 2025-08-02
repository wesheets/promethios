/**
 * Agent Log Segregation Routes
 * API endpoints for isolated agent audit trails and cross-agent correlation
 * Provides secure per-agent log access with cryptographic verification
 */

const express = require('express');
const router = express.Router();
const agentLogSegregationService = require('../services/agentLogSegregationService');
const agentIdentityService = require('../services/agentIdentityService');
const auditService = require('../services/auditService');

// Middleware for request validation and logging
const validateRequest = (req, res, next) => {
  // Log API access for audit trail
  auditService.logEvent('api_access', req.user?.id || 'anonymous', {
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  next();
};

// Middleware for authentication (placeholder - integrate with existing auth)
const requireAuth = (req, res, next) => {
  // TODO: Integrate with existing Promethios authentication
  // For now, allow all requests for development
  req.user = { id: 'system', role: 'admin' };
  next();
};

// Middleware for role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * POST /api/agent-logs/initialize
 * Initialize isolated log chain for an agent
 */
router.post('/initialize', validateRequest, requireAuth, requireRole(['admin', 'agent_manager']), async (req, res) => {
  try {
    const { agentId, agentMetadata } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing required field: agentId'
      });
    }
    
    // Initialize agent chain
    const chainMetadata = await agentLogSegregationService.initializeAgentChain(agentId, agentMetadata || {});
    
    res.status(201).json({
      success: true,
      data: chainMetadata,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error initializing agent chain:', error);
    res.status(500).json({
      error: 'Failed to initialize agent chain',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-logs/:agentId/log
 * Log event to isolated agent chain
 */
router.post('/:agentId/log', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { eventType, eventData, metadata } = req.body;
    
    if (!eventType) {
      return res.status(400).json({
        error: 'Missing required field: eventType'
      });
    }
    
    // Log to agent chain
    const result = await agentLogSegregationService.logToAgentChain(
      agentId,
      req.user.id,
      eventType,
      eventData || {},
      metadata || {}
    );
    
    res.status(201).json({
      success: true,
      data: result,
      cryptographicProof: {
        entryId: result.logEntry.id,
        chainPosition: result.logEntry.chainPosition,
        currentHash: result.logEntry.currentHash,
        signature: result.logEntry.signature,
        verificationStatus: result.logEntry.verificationStatus
      }
    });
    
  } catch (error) {
    console.error('Error logging to agent chain:', error);
    res.status(500).json({
      error: 'Failed to log to agent chain',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/:agentId
 * Query isolated agent logs
 */
router.get('/:agentId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const {
      eventType,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      includeVerification = 'false'
    } = req.query;
    
    // Build filters
    const filters = {
      eventType,
      userId,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeVerification: includeVerification === 'true'
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // Query agent logs
    const result = await agentLogSegregationService.queryAgentLogs(agentId, filters);
    
    res.json({
      success: true,
      data: result,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        hasMore: result.hasMore
      }
    });
    
  } catch (error) {
    console.error('Error querying agent logs:', error);
    res.status(500).json({
      error: 'Failed to query agent logs',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-logs/:agentId/verify
 * Verify isolated agent chain integrity
 */
router.post('/:agentId/verify', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { maxEntries } = req.body;
    
    // Verify chain integrity
    const verification = await agentLogSegregationService.verifyAgentChainIntegrity(agentId, maxEntries);
    
    res.json({
      success: true,
      verification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error verifying agent chain:', error);
    res.status(500).json({
      error: 'Failed to verify agent chain',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-logs/correlation
 * Create cross-agent correlation
 */
router.post('/correlation', validateRequest, requireAuth, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { agentIds, correlationType, correlationData, metadata } = req.body;
    
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length < 2) {
      return res.status(400).json({
        error: 'At least two agentIds required for correlation'
      });
    }
    
    if (!correlationType) {
      return res.status(400).json({
        error: 'Missing required field: correlationType'
      });
    }
    
    // Create correlation
    const correlation = await agentLogSegregationService.createCrossAgentCorrelation(
      agentIds,
      correlationType,
      correlationData || {},
      metadata || {}
    );
    
    res.status(201).json({
      success: true,
      data: correlation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error creating cross-agent correlation:', error);
    res.status(500).json({
      error: 'Failed to create cross-agent correlation',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/correlation/:correlationId
 * Get cross-agent correlation details
 */
router.get('/correlation/:correlationId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { correlationId } = req.params;
    
    // Get correlation from service
    const correlation = agentLogSegregationService.crossAgentCorrelations.get(correlationId);
    
    if (!correlation) {
      return res.status(404).json({
        error: 'Correlation not found',
        correlationId
      });
    }
    
    // Check if correlation is still active
    const now = new Date();
    const expiresAt = new Date(correlation.expiresAt);
    
    if (now > expiresAt) {
      correlation.status = 'expired';
    }
    
    res.json({
      success: true,
      data: correlation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting correlation:', error);
    res.status(500).json({
      error: 'Failed to get correlation',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/chains
 * List all agent chains
 */
router.get('/chains', validateRequest, requireAuth, async (req, res) => {
  try {
    const { status, includeArchived = 'false' } = req.query;
    
    const filters = {
      status,
      includeArchived: includeArchived === 'true'
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // List agent chains
    const result = await agentLogSegregationService.listAgentChains(filters);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error listing agent chains:', error);
    res.status(500).json({
      error: 'Failed to list agent chains',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-logs/verify-multiple
 * Verify multiple agent chains
 */
router.post('/verify-multiple', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentIds, maxEntries } = req.body;
    
    if (!agentIds || !Array.isArray(agentIds)) {
      return res.status(400).json({
        error: 'agentIds must be an array'
      });
    }
    
    // Verify multiple chains
    const verificationResults = {};
    
    for (const agentId of agentIds) {
      try {
        verificationResults[agentId] = await agentLogSegregationService.verifyAgentChainIntegrity(agentId, maxEntries);
      } catch (error) {
        verificationResults[agentId] = {
          agentId,
          valid: false,
          error: error.message
        };
      }
    }
    
    // Calculate overall statistics
    const allResults = Object.values(verificationResults);
    const validChains = allResults.filter(result => result.valid).length;
    const totalEntries = allResults.reduce((sum, result) => sum + (result.entryCount || 0), 0);
    const totalVerified = allResults.reduce((sum, result) => sum + (result.verifiedEntries || 0), 0);
    
    res.json({
      success: true,
      verificationResults,
      summary: {
        totalChains: allResults.length,
        validChains,
        invalidChains: allResults.length - validChains,
        totalEntries,
        totalVerified,
        overallIntegrityPercentage: totalEntries > 0 ? (totalVerified / totalEntries) * 100 : 100
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error verifying multiple chains:', error);
    res.status(500).json({
      error: 'Failed to verify multiple chains',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/:agentId/export
 * Export isolated agent logs
 */
router.get('/:agentId/export', validateRequest, requireAuth, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const {
      eventType,
      userId,
      startDate,
      endDate,
      format = 'json',
      includeVerification = 'true'
    } = req.query;
    
    // Build filters for export
    const filters = {
      eventType,
      userId,
      startDate,
      endDate,
      limit: 10000, // Large limit for export
      includeVerification: includeVerification === 'true'
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // Query logs for export
    const result = await agentLogSegregationService.queryAgentLogs(agentId, filters);
    
    // Verify chain integrity for export
    const chainVerification = await agentLogSegregationService.verifyAgentChainIntegrity(agentId);
    
    // Create export data
    const exportData = {
      metadata: {
        agentId,
        exportTimestamp: new Date().toISOString(),
        exportFormat: format,
        filters,
        totalRecords: result.total,
        segregationVersion: '1.0'
      },
      chainMetadata: result.chainMetadata,
      chainVerification,
      logs: result.logs,
      cryptographicProof: {
        exportHash: agentLogSegregationService.generateHash(JSON.stringify(result.logs)),
        queryProof: result.cryptographicProof,
        verificationProof: chainVerification
      }
    };
    
    // Set appropriate headers for download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `agent-${agentId}-logs-${timestamp}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertLogsToCSV(result.logs);
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    }
    
    // Log export activity
    await agentLogSegregationService.logToAgentChain(
      agentId,
      req.user.id,
      'logs_exported',
      {
        filters,
        format,
        recordCount: result.logs.length,
        exportedBy: req.user.id
      },
      {
        exportTimestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
  } catch (error) {
    console.error('Error exporting agent logs:', error);
    res.status(500).json({
      error: 'Failed to export agent logs',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-logs/:agentId/archive
 * Schedule archival for agent chain
 */
router.post('/:agentId/archive', validateRequest, requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Schedule archival
    const result = await agentLogSegregationService.scheduleChainArchival(agentId);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error scheduling chain archival:', error);
    res.status(500).json({
      error: 'Failed to schedule chain archival',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/stats
 * Get segregation service statistics
 */
router.get('/system/stats', validateRequest, requireAuth, async (req, res) => {
  try {
    const stats = await agentLogSegregationService.getSegregationStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting segregation stats:', error);
    res.status(500).json({
      error: 'Failed to get segregation stats',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-logs/health
 * Health check for segregation service
 */
router.get('/system/health', async (req, res) => {
  try {
    const stats = await agentLogSegregationService.getSegregationStats();
    
    const health = {
      status: stats.error ? 'error' : 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0',
      metrics: {
        totalChains: stats.totalAgentChains || 0,
        totalEntries: stats.totalEntries || 0,
        activeCorrelations: stats.activeCorrelations || 0,
        totalCorrelations: stats.totalCorrelations || 0
      }
    };
    
    const statusCode = health.status === 'operational' ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Error checking segregation service health:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Helper function to convert logs to CSV format
 */
function convertLogsToCSV(logs) {
  const headers = [
    'id', 'agentId', 'chainId', 'userId', 'eventType', 'timestamp',
    'chainPosition', 'currentHash', 'previousHash', 'signature', 'verificationStatus'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const log of logs) {
    const row = [
      log.id,
      log.agentId,
      log.chainId,
      log.userId,
      log.eventType,
      log.timestamp,
      log.chainPosition,
      log.currentHash,
      log.previousHash,
      log.signature,
      log.verificationStatus
    ];
    csvRows.push(row.map(field => `"${field}"`).join(','));
  }
  
  return csvRows.join('\n');
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Agent log segregation API error:', error);
  
  res.status(500).json({
    error: 'Internal server error in agent log segregation system',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

module.exports = router;

