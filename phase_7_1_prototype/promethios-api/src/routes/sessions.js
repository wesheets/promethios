/**
 * Sessions API Routes
 * Handles session management for multi-agent systems
 */

const express = require('express');
const router = express.Router();
const sessionManager = require('../services/sessionManager');

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔍 Sessions API - Received POST request');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));

    const {
      // Support both old format (systemId, systemName, userId) and new format (agentId, agentName)
      systemId,
      systemName,
      userId,
      agentId,
      agentName,
      governancePolicies = [],
      trustMetrics = {},
      options = {}
    } = req.body;

    console.log('🔍 Extracted fields:');
    console.log('  - systemId:', systemId);
    console.log('  - systemName:', systemName);
    console.log('  - userId:', userId);
    console.log('  - agentId:', agentId);
    console.log('  - agentName:', agentName);
    console.log('  - governancePolicies:', governancePolicies);
    console.log('  - trustMetrics:', trustMetrics);

    // Use agentId/agentName if provided, otherwise fall back to systemId/systemName
    const finalSystemId = agentId || systemId;
    const finalSystemName = agentName || systemName;
    const finalUserId = userId || 'anonymous'; // Default userId for agent sessions

    console.log('🔍 Final values:');
    console.log('  - finalSystemId:', finalSystemId);
    console.log('  - finalSystemName:', finalSystemName);
    console.log('  - finalUserId:', finalUserId);

    // Validate required fields
    if (!finalSystemId || !finalSystemName) {
      console.log('❌ Validation failed - missing required fields');
      console.log('  - finalSystemId present:', !!finalSystemId);
      console.log('  - finalSystemName present:', !!finalSystemName);
      return res.status(400).json({
        error: 'Missing required fields: agentId/systemId and agentName/systemName are required',
        debug: {
          receivedSystemId: systemId,
          receivedSystemName: systemName,
          receivedAgentId: agentId,
          receivedAgentName: agentName,
          finalSystemId,
          finalSystemName
        }
      });
    }

    // Create session with governance data
    const sessionOptions = {
      ...options,
      governancePolicies,
      trustMetrics
    };

    console.log('🔍 Creating session with options:', JSON.stringify(sessionOptions, null, 2));

    const session = sessionManager.createSession(finalSystemId, finalSystemName, finalUserId, sessionOptions);

    console.log('✅ Session created successfully:', session.id);
    console.log('🔍 Session details:', JSON.stringify(session, null, 2));

    const responseData = {
      success: true,
      session: {
        id: session.id,
        sessionId: session.id, // Also provide sessionId for frontend compatibility
        systemId: session.systemId,
        systemName: session.systemName,
        userId: session.userId,
        status: session.status,
        createdAt: session.createdAt,
        startTime: session.createdAt, // Also provide startTime for frontend compatibility
        messageLimit: session.messageLimit,
        governanceEnabled: session.governanceEnabled,
        messageCount: 0,
        violations: [],
        currentTrustScore: 85 // Default trust score
      }
    };

    console.log('🔍 Sending response:', JSON.stringify(responseData, null, 2));

    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Error creating session:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Request body that caused error:', JSON.stringify(req.body, null, 2));
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message,
      debug: {
        errorType: error.constructor.name,
        requestBody: req.body
      }
    });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get session details
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        systemId: session.systemId,
        systemName: session.systemName,
        userId: session.userId,
        status: session.status,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        messageCount: session.messageCount,
        messageLimit: session.messageLimit,
        governanceEnabled: session.governanceEnabled,
        emergencyStop: session.emergencyStop,
        stopReason: session.stopReason,
        loopDetected: session.loopDetected,
        costTracking: session.costTracking
      }
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({
      error: 'Failed to fetch session',
      details: error.message
    });
  }
});

/**
 * GET /api/sessions
 * List all active sessions
 */
router.get('/', async (req, res) => {
  try {
    const activeSessions = sessionManager.getActiveSessions();
    const stats = sessionManager.getSessionStats();

    res.json({
      success: true,
      sessions: activeSessions,
      stats: stats
    });

  } catch (error) {
    console.error('Error listing sessions:', error);
    res.status(500).json({
      error: 'Failed to list sessions',
      details: error.message
    });
  }
});

/**
 * POST /api/sessions/:sessionId/emergency-stop
 * Emergency stop a session
 */
router.post('/:sessionId/emergency-stop', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'user_emergency_stop' } = req.body;

    const success = sessionManager.emergencyStop(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found or already stopped'
      });
    }

    res.json({
      success: true,
      message: 'Session emergency stopped successfully',
      sessionId: sessionId,
      reason: reason
    });

  } catch (error) {
    console.error('Error emergency stopping session:', error);
    res.status(500).json({
      error: 'Failed to emergency stop session',
      details: error.message
    });
  }
});

/**
 * POST /api/sessions/:sessionId/terminate
 * Terminate a session normally
 */
router.post('/:sessionId/terminate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'normal_termination' } = req.body;

    const success = sessionManager.terminateSession(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session terminated successfully',
      sessionId: sessionId,
      reason: reason
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      details: error.message
    });
  }
});

/**
 * PUT /api/sessions/:sessionId/activity
 * Update session activity
 */
router.put('/:sessionId/activity', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messageCount } = req.body;

    const success = sessionManager.updateSessionActivity(sessionId, messageCount);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found or terminated'
      });
    }

    res.json({
      success: true,
      message: 'Session activity updated'
    });

  } catch (error) {
    console.error('Error updating session activity:', error);
    res.status(500).json({
      error: 'Failed to update session activity',
      details: error.message
    });
  }
});

module.exports = router;

