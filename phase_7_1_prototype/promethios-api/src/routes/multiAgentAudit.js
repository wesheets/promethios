const express = require('express');
const router = express.Router();
const multiAgentAuditService = require('../services/multiAgentAuditService');

/**
 * POST /api/multi-agent-audit/collective-behavior
 * Log collective behavior event with emergent behavior detection
 */
router.post('/collective-behavior', async (req, res) => {
  try {
    const {
      contextId,
      behaviorData,
      detectedBy = 'system'
    } = req.body;

    // Validate required fields
    if (!contextId || !behaviorData) {
      return res.status(400).json({
        error: 'Missing required fields: contextId, behaviorData'
      });
    }

    const behaviorId = await multiAgentAuditService.logCollectiveBehavior(
      contextId,
      behaviorData,
      detectedBy
    );

    res.status(201).json({
      success: true,
      behaviorId,
      message: 'Collective behavior logged successfully'
    });

  } catch (error) {
    console.error('Error logging collective behavior:', error);
    res.status(500).json({
      error: 'Failed to log collective behavior',
      details: error.message
    });
  }
});

/**
 * POST /api/multi-agent-audit/coordination-protocol
 * Log coordination protocol execution with verification
 */
router.post('/coordination-protocol', async (req, res) => {
  try {
    const {
      contextId,
      protocolData,
      initiatedBy
    } = req.body;

    // Validate required fields
    if (!contextId || !protocolData || !initiatedBy) {
      return res.status(400).json({
        error: 'Missing required fields: contextId, protocolData, initiatedBy'
      });
    }

    const protocolId = await multiAgentAuditService.logCoordinationProtocol(
      contextId,
      protocolData,
      initiatedBy
    );

    res.status(201).json({
      success: true,
      protocolId,
      message: 'Coordination protocol logged successfully'
    });

  } catch (error) {
    console.error('Error logging coordination protocol:', error);
    res.status(500).json({
      error: 'Failed to log coordination protocol',
      details: error.message
    });
  }
});

/**
 * POST /api/multi-agent-audit/consensus-event
 * Log consensus event with mathematical verification
 */
router.post('/consensus-event', async (req, res) => {
  try {
    const {
      contextId,
      consensusData,
      facilitatedBy = 'system'
    } = req.body;

    // Validate required fields
    if (!contextId || !consensusData) {
      return res.status(400).json({
        error: 'Missing required fields: contextId, consensusData'
      });
    }

    const consensusId = await multiAgentAuditService.logConsensusEvent(
      contextId,
      consensusData,
      facilitatedBy
    );

    res.status(201).json({
      success: true,
      consensusId,
      message: 'Consensus event logged successfully'
    });

  } catch (error) {
    console.error('Error logging consensus event:', error);
    res.status(500).json({
      error: 'Failed to log consensus event',
      details: error.message
    });
  }
});

/**
 * POST /api/multi-agent-audit/inter-agent-communication
 * Log inter-agent communication with cryptographic integrity
 */
router.post('/inter-agent-communication', async (req, res) => {
  try {
    const {
      fromAgentId,
      toAgentId,
      messageData,
      contextId = null
    } = req.body;

    // Validate required fields
    if (!fromAgentId || !toAgentId || !messageData) {
      return res.status(400).json({
        error: 'Missing required fields: fromAgentId, toAgentId, messageData'
      });
    }

    const communicationId = await multiAgentAuditService.logInterAgentCommunication(
      fromAgentId,
      toAgentId,
      messageData,
      contextId
    );

    res.status(201).json({
      success: true,
      communicationId,
      message: 'Inter-agent communication logged successfully'
    });

  } catch (error) {
    console.error('Error logging inter-agent communication:', error);
    res.status(500).json({
      error: 'Failed to log inter-agent communication',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/emergent-behaviors/:contextId
 * Analyze emergent behaviors for a specific context
 */
router.get('/emergent-behaviors/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    const { timeRange } = req.query;

    let parsedTimeRange = null;
    if (timeRange) {
      try {
        parsedTimeRange = JSON.parse(timeRange);
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid timeRange format. Expected JSON with start and end dates.'
        });
      }
    }

    const analysis = await multiAgentAuditService.analyzeEmergentBehaviors(
      contextId,
      parsedTimeRange
    );

    res.json({
      contextId,
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing emergent behaviors:', error);
    res.status(500).json({
      error: 'Failed to analyze emergent behaviors',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/emergent-behaviors
 * Analyze emergent behaviors across all contexts
 */
router.get('/emergent-behaviors', async (req, res) => {
  try {
    const { timeRange } = req.query;

    let parsedTimeRange = null;
    if (timeRange) {
      try {
        parsedTimeRange = JSON.parse(timeRange);
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid timeRange format. Expected JSON with start and end dates.'
        });
      }
    }

    const analysis = await multiAgentAuditService.analyzeEmergentBehaviors(
      null,
      parsedTimeRange
    );

    res.json({
      scope: 'all_contexts',
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing emergent behaviors:', error);
    res.status(500).json({
      error: 'Failed to analyze emergent behaviors',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/report/:contextId
 * Generate comprehensive MAS audit report
 */
router.get('/report/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    const { reportType = 'comprehensive' } = req.query;

    const report = await multiAgentAuditService.generateMASAuditReport(
      contextId,
      reportType
    );

    res.json(report);

  } catch (error) {
    console.error('Error generating MAS audit report:', error);
    res.status(500).json({
      error: 'Failed to generate MAS audit report',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/context/:contextId
 * Get MAS context audit data
 */
router.get('/context/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const contextAudit = multiAgentAuditService.getMASContext(contextId);
    if (!contextAudit) {
      return res.status(404).json({
        error: 'MAS context not found',
        contextId
      });
    }

    res.json(contextAudit);

  } catch (error) {
    console.error('Error fetching MAS context:', error);
    res.status(500).json({
      error: 'Failed to fetch MAS context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/collective-behaviors/:contextId
 * Get all collective behaviors for a context
 */
router.get('/collective-behaviors/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const behaviors = multiAgentAuditService.getCollectiveBehaviors(contextId);

    res.json({
      contextId,
      behaviors,
      total: behaviors.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching collective behaviors:', error);
    res.status(500).json({
      error: 'Failed to fetch collective behaviors',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/coordination-protocols/:contextId
 * Get all coordination protocols for a context
 */
router.get('/coordination-protocols/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const protocols = multiAgentAuditService.getCoordinationProtocols(contextId);

    res.json({
      contextId,
      protocols,
      total: protocols.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching coordination protocols:', error);
    res.status(500).json({
      error: 'Failed to fetch coordination protocols',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/consensus-events/:contextId
 * Get all consensus events for a context
 */
router.get('/consensus-events/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const consensus = multiAgentAuditService.getConsensusEvents(contextId);

    res.json({
      contextId,
      consensus,
      total: consensus.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching consensus events:', error);
    res.status(500).json({
      error: 'Failed to fetch consensus events',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/communications/:contextId
 * Get all communications for a context
 */
router.get('/communications/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const communications = multiAgentAuditService.getCommunications(contextId);

    res.json({
      contextId,
      communications,
      total: communications.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({
      error: 'Failed to fetch communications',
      details: error.message
    });
  }
});

/**
 * POST /api/multi-agent-audit/verify-integrity/:contextId
 * Verify cryptographic integrity of MAS audit data
 */
router.post('/verify-integrity/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;

    const verification = multiAgentAuditService.verifyMASIntegrity(contextId);

    res.json({
      contextId,
      verification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying MAS integrity:', error);
    res.status(500).json({
      error: 'Failed to verify MAS integrity',
      details: error.message
    });
  }
});

/**
 * GET /api/multi-agent-audit/stats
 * Get overall MAS audit statistics
 */
router.get('/stats', async (req, res) => {
  try {
    // Get counts from the service
    const stats = {
      totalContexts: multiAgentAuditService.masContexts.size,
      totalCollectiveBehaviors: multiAgentAuditService.collectiveBehaviors.size,
      totalCoordinationProtocols: multiAgentAuditService.coordinationProtocols.size,
      totalConsensusEvents: multiAgentAuditService.consensusEvents.size,
      totalCommunications: multiAgentAuditService.communicationLogs.size,
      timestamp: new Date().toISOString()
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching MAS audit stats:', error);
    res.status(500).json({
      error: 'Failed to fetch MAS audit stats',
      details: error.message
    });
  }
});

module.exports = router;

