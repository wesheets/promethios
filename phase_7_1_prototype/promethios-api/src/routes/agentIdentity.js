/**
 * Agent Identity Routes
 * API endpoints for agent identity management and verification
 * Provides secure agent authentication and certificate management
 */

const express = require('express');
const router = express.Router();
const agentIdentityService = require('../services/agentIdentityService');
const agentLogSegregationService = require('../services/agentLogSegregationService');
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
 * POST /api/agent-identity/generate
 * Generate cryptographic identity for an agent
 */
router.post('/generate', validateRequest, requireAuth, requireRole(['admin', 'agent_manager']), async (req, res) => {
  try {
    const { agentId, agentMetadata } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing required field: agentId'
      });
    }
    
    // Generate agent identity
    const result = await agentIdentityService.generateAgentIdentity(agentId, agentMetadata || {});
    
    // Initialize isolated log chain
    const chainMetadata = await agentLogSegregationService.initializeAgentChain(agentId, agentMetadata);
    
    res.status(201).json({
      success: true,
      data: {
        identity: {
          agentId: result.identity.agentId,
          identityId: result.identity.identityId,
          createdAt: result.identity.createdAt,
          status: result.identity.status,
          publicKeyFingerprint: result.publicKeyFingerprint
        },
        certificate: {
          certificateId: result.certificate.certificateId,
          issuedAt: result.certificate.issuedAt,
          expiresAt: result.certificate.expiresAt,
          status: result.certificate.status
        },
        isolatedChain: {
          chainId: chainMetadata.chainId,
          genesisHash: chainMetadata.genesisHash,
          createdAt: chainMetadata.createdAt
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating agent identity:', error);
    res.status(500).json({
      error: 'Failed to generate agent identity',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-identity/verify
 * Verify agent identity and certificate
 */
router.post('/verify', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId, publicKey, signature, data } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing required field: agentId'
      });
    }
    
    // Verify agent identity
    const verification = await agentIdentityService.verifyAgentIdentity(agentId, publicKey, signature, data);
    
    res.json({
      success: true,
      verification,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error verifying agent identity:', error);
    res.status(500).json({
      error: 'Failed to verify agent identity',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-identity/session
 * Create authenticated session for an agent
 */
router.post('/session', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId, sessionMetadata } = req.body;
    
    if (!agentId) {
      return res.status(400).json({
        error: 'Missing required field: agentId'
      });
    }
    
    // Create agent session
    const session = await agentIdentityService.createAgentSession(agentId, sessionMetadata || {});
    
    res.status(201).json({
      success: true,
      session,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error creating agent session:', error);
    res.status(500).json({
      error: 'Failed to create agent session',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-identity/session/:sessionId/validate
 * Validate agent session
 */
router.get('/session/:sessionId/validate', validateRequest, requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Validate session
    const validation = await agentIdentityService.validateAgentSession(sessionId);
    
    res.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating agent session:', error);
    res.status(500).json({
      error: 'Failed to validate agent session',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-identity/:agentId
 * Get agent identity information
 */
router.get('/:agentId', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    
    // Get agent identity
    const identity = await agentIdentityService.getAgentIdentity(agentId);
    
    if (!identity) {
      return res.status(404).json({
        error: 'Agent identity not found',
        agentId
      });
    }
    
    // Get chain metadata
    const chainMetadata = await agentLogSegregationService.agentChainMetadata.get(agentId);
    
    res.json({
      success: true,
      data: {
        ...identity,
        isolatedChain: chainMetadata ? {
          chainId: chainMetadata.chainId,
          entryCount: chainMetadata.entryCount,
          lastHash: chainMetadata.lastHash,
          verificationStatus: chainMetadata.verificationStatus
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error getting agent identity:', error);
    res.status(500).json({
      error: 'Failed to get agent identity',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-identity
 * List all agent identities
 */
router.get('/', validateRequest, requireAuth, async (req, res) => {
  try {
    const { status, includeRevoked = 'false' } = req.query;
    
    const filters = {
      status,
      includeRevoked: includeRevoked === 'true'
    };
    
    // Remove undefined values
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );
    
    // List agent identities
    const result = await agentIdentityService.listAgentIdentities(filters);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error listing agent identities:', error);
    res.status(500).json({
      error: 'Failed to list agent identities',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-identity/:agentId/revoke
 * Revoke agent certificate
 */
router.post('/:agentId/revoke', validateRequest, requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { agentId } = req.params;
    const { reason = 'manual_revocation' } = req.body;
    
    // Revoke certificate
    const result = await agentIdentityService.revokeCertificate(agentId, reason);
    
    // Log revocation to isolated chain
    await agentLogSegregationService.logToAgentChain(
      agentId,
      req.user.id,
      'certificate_revoked',
      {
        certificateId: result.certificateId,
        reason,
        revokedBy: req.user.id
      },
      {
        revocationTimestamp: result.revokedAt,
        adminAction: true
      }
    );
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error revoking agent certificate:', error);
    res.status(500).json({
      error: 'Failed to revoke agent certificate',
      details: error.message
    });
  }
});

/**
 * POST /api/agent-identity/:agentId/lifecycle
 * Track agent lifecycle event
 */
router.post('/:agentId/lifecycle', validateRequest, requireAuth, async (req, res) => {
  try {
    const { agentId } = req.params;
    const { event, eventData } = req.body;
    
    if (!event) {
      return res.status(400).json({
        error: 'Missing required field: event'
      });
    }
    
    // Track lifecycle event
    const lifecycleEvent = await agentIdentityService.trackAgentLifecycle(agentId, event, eventData || {});
    
    // Also log to isolated chain
    await agentLogSegregationService.logToAgentChain(
      agentId,
      req.user.id,
      'lifecycle_event',
      {
        event,
        eventId: lifecycleEvent.eventId,
        data: eventData
      },
      {
        lifecycleTracking: true,
        source: 'api'
      }
    );
    
    res.status(201).json({
      success: true,
      data: lifecycleEvent,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error tracking agent lifecycle:', error);
    res.status(500).json({
      error: 'Failed to track agent lifecycle',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-identity/stats
 * Get identity service statistics
 */
router.get('/system/stats', validateRequest, requireAuth, async (req, res) => {
  try {
    const identityStats = await agentIdentityService.getIdentityStats();
    const segregationStats = await agentLogSegregationService.getSegregationStats();
    
    res.json({
      success: true,
      stats: {
        identity: identityStats,
        segregation: segregationStats,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting identity stats:', error);
    res.status(500).json({
      error: 'Failed to get identity stats',
      details: error.message
    });
  }
});

/**
 * GET /api/agent-identity/health
 * Health check for identity service
 */
router.get('/system/health', async (req, res) => {
  try {
    const identityStats = await agentIdentityService.getIdentityStats();
    const segregationStats = await agentLogSegregationService.getSegregationStats();
    
    const health = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0',
      services: {
        identity: {
          status: identityStats.error ? 'error' : 'operational',
          totalIdentities: identityStats.totalIdentities || 0,
          activeSessions: identityStats.activeSessions || 0
        },
        segregation: {
          status: segregationStats.error ? 'error' : 'operational',
          totalChains: segregationStats.totalAgentChains || 0,
          totalEntries: segregationStats.totalEntries || 0
        }
      }
    };
    
    const hasErrors = health.services.identity.status === 'error' || 
                     health.services.segregation.status === 'error';
    
    const statusCode = hasErrors ? 503 : 200;
    if (hasErrors) {
      health.status = 'degraded';
    }
    
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Error checking identity service health:', error);
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Agent identity API error:', error);
  
  res.status(500).json({
    error: 'Internal server error in agent identity system',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contact administrator'
  });
});

module.exports = router;

