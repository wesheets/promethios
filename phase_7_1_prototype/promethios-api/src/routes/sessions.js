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
    const {
      systemId,
      systemName,
      userId,
      options = {}
    } = req.body;

    // Validate required fields
    if (!systemId || !systemName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: systemId, systemName, userId'
      });
    }

    // Create session
    const session = sessionManager.createSession(systemId, systemName, userId, options);

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        systemId: session.systemId,
        systemName: session.systemName,
        userId: session.userId,
        status: session.status,
        createdAt: session.createdAt,
        messageLimit: session.messageLimit,
        governanceEnabled: session.governanceEnabled
      }
    });

  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message
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

