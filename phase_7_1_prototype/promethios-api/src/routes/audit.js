/**
 * Audit API Routes
 * Handles audit logging and querying for governance and compliance
 */

const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');

/**
 * GET /api/audit/logs
 * Query audit logs with filters
 */
router.get('/logs', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      eventType: req.query.eventType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = auditService.queryAuditLogs(filters);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error querying audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query audit logs',
      details: error.message
    });
  }
});

/**
 * GET /api/audit/query
 * Alternative endpoint for querying audit logs (frontend compatibility)
 */
router.get('/query', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      eventType: req.query.eventType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = auditService.queryAuditLogs(filters);

    res.json({
      success: true,
      data: result.logs || [],
      total: result.total || 0,
      limit: filters.limit,
      offset: filters.offset,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error querying audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query audit logs',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/audit/logs
 * Create a new audit log entry
 */
router.post('/logs', async (req, res) => {
  try {
    const { eventType, userId, details = {}, metadata = {} } = req.body;

    if (!eventType || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventType, userId'
      });
    }

    const auditEntry = auditService.logEvent(eventType, userId, details, metadata);

    res.status(201).json({
      success: true,
      auditEntry: auditEntry
    });

  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit log',
      details: error.message
    });
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const stats = auditService.getAuditStats(timeRange);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit stats',
      details: error.message
    });
  }
});

/**
 * GET /api/audit/export
 * Export audit logs for compliance
 */
router.get('/export', async (req, res) => {
  try {
    const filters = {
      userId: req.query.userId,
      eventType: req.query.eventType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search
    };

    const format = req.query.format || 'json';

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const result = auditService.exportLogs(filters, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
      res.send(result);
    } else {
      res.json({
        success: true,
        ...result
      });
    }

  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export audit logs',
      details: error.message
    });
  }
});

/**
 * POST /api/audit/session/created
 * Log session creation event
 */
router.post('/session/created', async (req, res) => {
  try {
    const { userId, sessionId, systemName } = req.body;

    if (!userId || !sessionId || !systemName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, sessionId, systemName'
      });
    }

    const auditEntry = auditService.logSessionCreated(userId, sessionId, systemName);

    res.status(201).json({
      success: true,
      auditEntry: auditEntry
    });

  } catch (error) {
    console.error('Error logging session creation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log session creation',
      details: error.message
    });
  }
});

/**
 * POST /api/audit/session/terminated
 * Log session termination event
 */
router.post('/session/terminated', async (req, res) => {
  try {
    const { userId, sessionId, reason } = req.body;

    if (!userId || !sessionId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, sessionId, reason'
      });
    }

    const auditEntry = auditService.logSessionTerminated(userId, sessionId, reason);

    res.status(201).json({
      success: true,
      auditEntry: auditEntry
    });

  } catch (error) {
    console.error('Error logging session termination:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log session termination',
      details: error.message
    });
  }
});

/**
 * POST /api/audit/deployment
 * Log agent deployment event
 */
router.post('/deployment', async (req, res) => {
  try {
    const { userId, agentId, deploymentStatus } = req.body;

    if (!userId || !agentId || !deploymentStatus) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, agentId, deploymentStatus'
      });
    }

    const auditEntry = auditService.logAgentDeployment(userId, agentId, deploymentStatus);

    res.status(201).json({
      success: true,
      auditEntry: auditEntry
    });

  } catch (error) {
    console.error('Error logging deployment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log deployment',
      details: error.message
    });
  }
});

/**
 * POST /api/audit/governance/violation
 * Log governance violation event
 */
router.post('/governance/violation', async (req, res) => {
  try {
    const { userId, violationType, details } = req.body;

    if (!userId || !violationType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, violationType'
      });
    }

    const auditEntry = auditService.logGovernanceViolation(userId, violationType, details);

    res.status(201).json({
      success: true,
      auditEntry: auditEntry
    });

  } catch (error) {
    console.error('Error logging governance violation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log governance violation',
      details: error.message
    });
  }
});

/**
 * DELETE /api/audit/logs/cleanup
 * Clean up old audit logs
 */
router.delete('/logs/cleanup', async (req, res) => {
  try {
    const olderThanDays = parseInt(req.query.olderThanDays) || 90;
    const removedCount = auditService.clearOldLogs(olderThanDays);

    res.json({
      success: true,
      message: `Cleaned up ${removedCount} old audit logs`,
      removedCount: removedCount,
      olderThanDays: olderThanDays
    });

  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up audit logs',
      details: error.message
    });
  }
});

module.exports = router;

/**
 * CRITICAL FIX: Add /audit/log route for Universal Governance Adapter compatibility
 * This route is called directly by the frontend governance system
 */
router.post('/log', async (req, res) => {
  try {
    console.log('🚨 [AUDIT-DEBUG] /audit/log route called!');
    console.log('🚨 [AUDIT-DEBUG] Request body:', JSON.stringify(req.body, null, 2));

    const { 
      agent_id, 
      event_type, 
      details = {}, 
      metadata = {},
      user_id,
      timestamp 
    } = req.body;

    // Validate required fields
    if (!agent_id || !event_type) {
      console.log('❌ [AUDIT] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent_id, event_type'
      });
    }

    console.log(`📝 [Audit] Creating audit entry for agent ${agent_id}`);

    // Create audit entry using existing service
    const auditEntry = auditService.logEvent(
      event_type, 
      user_id || agent_id, 
      {
        agent_id,
        ...details
      }, 
      {
        timestamp: timestamp || new Date().toISOString(),
        source: 'universal_governance_adapter',
        ...metadata
      }
    );

    console.log('✅ [Audit] Audit entry created successfully');

    res.status(200).json({
      success: true,
      audit_id: auditEntry.id,
      timestamp: auditEntry.timestamp
    });

  } catch (error) {
    console.error('❌ [Audit] Failed to create audit entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create audit entry',
      details: error.message
    });
  }
});

