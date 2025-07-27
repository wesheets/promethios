/**
 * Cryptographic Audit Routes
 * Enterprise-grade API endpoints for cryptographic audit trail access
 * Provides secure, verified access to agent audit logs with cryptographic proofs
 */

const express = require('express');
const router = express.Router();
const cryptographicAuditService = require('../services/cryptographicAuditService');
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
 * POST /api/cryptographic-audit/log
 * Create a new cryptographic audit log entry
 */
router.post('/log', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId, eventType, eventData, metadata } = req.body;
    
    // Validate required fields
    if (!agentId || !eventType) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, eventType'
      });
    }
    
    // Create cryptographic log entry
    const result = await cryptographicAuditService.logCryptographicEvent(
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
        entryId: result.cryptographicEntry?.id,
        hash: result.cryptographicEntry?.currentHash,
        signature: result.cryptographicEntry?.signature,
        verificationStatus: result.verificationStatus
      }
    });
    
  } catch (error) {
    console.error('Error creating cryptographic audit log:', error);
    res.status(500).json({
      error: 'Failed to create cryptographic audit log',
      details: error.message
    });
  }
});

/**
 * GET /api/cryptographic-audit/logs
 * Query cryptographic audit logs with filters and verification
 */
router.get('/logs', validateRequest, requireAuth, async (req, res) => {
  try {
    const {
      agentId,
      userId,
      eventType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      includeVerification = 'false'
    } = req.query;
    
    // Parse boolean parameter
    const includeVerificationBool = includeVerification === 'true';
    
    // Build filters object
    const filters = {
      agentId,
      userId,
      eventType,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeVerification: includeVerificationBool
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // Query cryptographic logs
    const result = await cryptographicAuditService.queryCryptographicLogs(filters);
    
    res.json({
      success: true,
      data: result,
      cryptographicProof: result.cryptographicProof,
      pagination: {
        limit: result.limit,
        offset: result.offset,
        total: result.total,
        hasMore: result.hasMore
      }
    });
    
  } catch (error) {
    console.error('Error querying cryptographic audit logs:', error);
    res.status(500).json({
      error: 'Failed to query cryptographic audit logs',
      details: error.message
    });
  }
});

/**
 * GET /api/cryptographic-audit/logs/:agentId
 * Get cryptographic audit logs for a specific agent
 */
router.get('/logs/:agentId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const {
      limit = 100,
      offset = 0,
      includeVerification = 'true'
    } = req.query;
    
    // Query logs for specific agent
    const result = await cryptographicAuditService.queryCryptographicLogs({
      agentId,
      limit: parseInt(limit),
      offset: parseInt(offset),
      includeVerification: includeVerification === 'true'
    });
    
    // Get chain integrity for the agent
    const chainIntegrity = await cryptographicAuditService.verifyChainIntegrity(agentId);
    
    res.json({
      success: true,
      agentId,
      data: result,
      chainIntegrity,
      cryptographicProof: result.cryptographicProof
    });
    
  } catch (error) {
    console.error('Error getting agent audit logs:', error);
    res.status(500).json({
      error: 'Failed to get agent audit logs',
      details: error.message
    });
  }
});

/**
 * POST /api/cryptographic-audit/verify
 * Verify the integrity of cryptographic audit trails
 */
router.post('/verify', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentIds, maxEntries } = req.body;
    
    // Verify chain integrity
    const verificationResults = await cryptographicAuditService.verifyMultipleChains(
      agentIds,
      maxEntries
    );
    
    // Calculate overall verification status
    const allResults = Object.values(verificationResults);
    const overallValid = allResults.every(result => result.valid);
    const totalEntries = allResults.reduce((sum, result) => sum + result.entryCount, 0);
    const totalVerified = allResults.reduce((sum, result) => sum + result.verifiedEntries, 0);
    
    res.json({
      success: true,
      verificationResults,
      summary: {
        overallValid,
        totalEntries,
        totalVerified,
        integrityPercentage: totalEntries > 0 ? (totalVerified / totalEntries) * 100 : 100,
        verificationTimestamp: new Date().toISOString()
      },
      cryptographicProof: {
        verificationHash: cryptographicAuditService.generateHash(JSON.stringify(verificationResults)),
        signature: cryptographicAuditService.generateSignature(verificationResults)
      }
    });
    
  } catch (error) {
    console.error('Error verifying cryptographic audit trails:', error);
    res.status(500).json({
      error: 'Failed to verify cryptographic audit trails',
      details: error.message
    });
  }
});

/**
 * GET /api/cryptographic-audit/export
 * Export cryptographic audit logs with verification proofs
 */
router.get('/export', validateRequest, requireAuth, requireRole(['admin', 'auditor']), async (req, res) => {
  try {
    const {
      agentId,
      userId,
      eventType,
      startDate,
      endDate,
      format = 'json'
    } = req.query;
    
    // Build export filters
    const filters = {
      agentId,
      userId,
      eventType,
      startDate,
      endDate
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // Export cryptographic logs
    const exportData = await cryptographicAuditService.exportCryptographicLogs(filters, format);
    
    // Set appropriate headers for download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cryptographic-audit-export-${timestamp}.${format}`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
    }
    
    // Log export activity
    await cryptographicAuditService.logCryptographicEvent(
      'system',
      req.user.id,
      'audit_export',
      {
        filters,
        format,
        recordCount: exportData.logs?.length || 0
      },
      {
        exportTimestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
  } catch (error) {
    console.error('Error exporting cryptographic audit logs:', error);
    res.status(500).json({
      error: 'Failed to export cryptographic audit logs',
      details: error.message
    });
  }
});

/**
 * GET /api/cryptographic-audit/stats
 * Get cryptographic audit system statistics
 */
router.get('/stats', validateRequest, requireAuth, async (req, res) => {
  try {
    const stats = await cryptographicAuditService.getCryptographicAuditStats();
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting cryptographic audit stats:', error);
    res.status(500).json({
      error: 'Failed to get cryptographic audit stats',
      details: error.message
    });
  }
});

/**
 * POST /api/cryptographic-audit/merkle-proof
 * Generate Merkle proof for a specific audit entry
 */
router.post('/merkle-proof', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId, entryId } = req.body;
    
    if (!agentId || !entryId) {
      return res.status(400).json({
        error: 'Missing required fields: agentId, entryId'
      });
    }
    
    // Generate Merkle proof
    const merkleProof = cryptographicAuditService.generateMerkleProof(agentId, entryId);
    
    res.json({
      success: true,
      merkleProof,
      cryptographicProof: {
        proofHash: cryptographicAuditService.generateHash(JSON.stringify(merkleProof)),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating Merkle proof:', error);
    res.status(500).json({
      error: 'Failed to generate Merkle proof',
      details: error.message
    });
  }
});

/**
 * GET /api/cryptographic-audit/health
 * Health check endpoint for cryptographic audit system
 */
router.get('/health', async (req, res) => {
  try {
    const stats = await cryptographicAuditService.getCryptographicAuditStats();
    
    const health = {
      status: stats.systemStatus || 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0',
      cryptographicIntegrity: stats.overallIntegrity || 0,
      totalAgents: stats.totalAgents || 0,
      totalEntries: stats.totalEntries || 0
    };
    
    const statusCode = health.status === 'operational' ? 200 : 503;
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Error checking cryptographic audit health:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/cryptographic-audit/cleanup
 * Cleanup old cryptographic audit logs (admin only)
 */
router.delete('/cleanup', validateRequest, requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { retentionPeriod } = req.body;
    
    // Cleanup old logs
    const cleanedCount = await cryptographicAuditService.cleanupOldLogs(retentionPeriod);
    
    // Log cleanup activity
    await cryptographicAuditService.logCryptographicEvent(
      'system',
      req.user.id,
      'audit_cleanup',
      {
        cleanedCount,
        retentionPeriod: retentionPeriod || 'default'
      },
      {
        cleanupTimestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );
    
    res.json({
      success: true,
      cleanedCount,
      message: `Successfully cleaned up ${cleanedCount} old audit entries`
    });
    
  } catch (error) {
    console.error('Error cleaning up cryptographic audit logs:', error);
    res.status(500).json({
      error: 'Failed to cleanup cryptographic audit logs',
      details: error.message
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Cryptographic audit API error:', error);
  
  res.status(500).json({
    error: 'Internal server error in cryptographic audit system',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

module.exports = router;

