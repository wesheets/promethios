const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const sessionManager = require('../services/sessionManager');

// In-memory storage for demo (in production, use database)
const contexts = new Map();

/**
 * POST /api/multi_agent_system/context
 * Create a new multi-agent context for coordination
 */
router.post('/context', async (req, res) => {
  try {
    const {
      name,
      agent_ids,
      collaboration_model,
      policies = {},
      governance_enabled = true,
      metadata = {}
    } = req.body;

    // Validate required fields
    if (!name || !agent_ids || !collaboration_model) {
      return res.status(400).json({
        error: 'Missing required fields: name, agent_ids, collaboration_model'
      });
    }

    // Create new context
    const context = {
      context_id: `ctx_${uuidv4().replace(/-/g, '').substring(0, 8)}`,
      name,
      agent_ids,
      collaboration_model,
      status: 'active',
      created_at: new Date().toISOString(),
      policies,
      governance_enabled,
      metadata
    };

    // Store context (in production, save to database)
    contexts.set(context.context_id, context);

    // Log for debugging
    console.log(`Created multi-agent context: ${context.context_id}`);

    res.status(201).json(context);

  } catch (error) {
    console.error('Error creating multi-agent context:', error);
    res.status(500).json({
      error: 'Failed to create multi-agent context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/context/:contextId
 * Get a specific multi-agent context
 */
router.get('/context/:contextId', async (req, res) => {
  try {
    const { contextId } = req.params;
    const context = contexts.get(contextId);

    if (!context) {
      return res.status(404).json({
        error: 'Context not found'
      });
    }

    res.json(context);

  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({
      error: 'Failed to fetch context',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/contexts
 * List all multi-agent contexts
 */
router.get('/contexts', async (req, res) => {
  try {
    const allContexts = Array.from(contexts.values());
    res.json({
      contexts: allContexts,
      total: allContexts.length
    });

  } catch (error) {
    console.error('Error listing contexts:', error);
    res.status(500).json({
      error: 'Failed to list contexts',
      details: error.message
    });
  }
});

// ============================================================================
// CHAT SESSION MANAGEMENT & SAFETY CONTROLS
// ============================================================================

/**
 * POST /api/multi_agent_system/chat/create-session
 * Create a new chat session with safety controls
 */
router.post('/chat/create-session', async (req, res) => {
  try {
    const {
      systemId,
      systemName,
      userId,
      messageLimit,
      sessionTimeout,
      governanceEnabled,
      metadata
    } = req.body;

    // Validate required fields
    if (!systemId || !systemName || !userId) {
      return res.status(400).json({
        error: 'Missing required fields: systemId, systemName, userId'
      });
    }

    // Create session with safety controls
    const session = sessionManager.createSession(systemId, systemName, userId, {
      messageLimit,
      sessionTimeout,
      governanceEnabled,
      metadata
    });

    console.log(`🛡️ Created chat session ${session.id} for system ${systemName}`);

    res.status(201).json({
      sessionId: session.id,
      systemId: session.systemId,
      systemName: session.systemName,
      status: session.status,
      messageLimit: session.messageLimit,
      sessionTimeout: session.sessionTimeout,
      governanceEnabled: session.governanceEnabled,
      createdAt: session.createdAt
    });

  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      error: 'Failed to create chat session',
      details: error.message
    });
  }
});

/**
 * POST /api/multi_agent_system/chat/send-message
 * Send message to multi-agent system with safety controls
 */
router.post('/chat/send-message', async (req, res) => {
  try {
    const {
      sessionId,
      systemId,
      message,
      attachments = [],
      governanceEnabled = true,
      userId
    } = req.body;

    console.log(`🔧 Received message for session ${sessionId}`);

    // Validate session
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    // Check if session can accept requests
    if (!sessionManager.canAcceptRequest(sessionId)) {
      return res.status(403).json({
        error: 'Session cannot accept new requests',
        reason: session.stopReason || 'Session is not active',
        status: session.status
      });
    }

    // Update session activity
    sessionManager.updateSessionActivity(sessionId, session.messageCount + 1);

    // Create abort controller for this request
    const abortController = new AbortController();
    const requestId = `req_${uuidv4().substring(0, 8)}`;
    
    // Track the request
    sessionManager.trackActiveRequest(sessionId, requestId, abortController);

    try {
      // Simulate multi-agent processing with safety controls
      console.log(`🤖 Processing message with ${session.systemName} multi-agent system`);
      
      // Check if session was stopped during processing
      if (!sessionManager.canAcceptRequest(sessionId)) {
        throw new Error('Session was stopped during processing');
      }

      // Simulate agent collaboration (in real implementation, this would call OpenAI)
      const response = await simulateMultiAgentResponse(
        message, 
        session, 
        abortController.signal,
        governanceEnabled
      );

      // Add response for loop detection
      sessionManager.addResponseForLoopDetection(sessionId, response.content);

      // Remove request from tracking
      sessionManager.removeActiveRequest(sessionId, requestId);

      console.log(`✅ Generated response for session ${sessionId}`);

      res.json({
        response: response.content,
        sessionId,
        messageCount: session.messageCount,
        governanceData: response.governanceData,
        metadata: {
          requestId,
          processingTime: response.processingTime,
          agentCount: response.agentCount
        }
      });

    } catch (error) {
      // Remove request from tracking
      sessionManager.removeActiveRequest(sessionId, requestId);
      
      if (error.name === 'AbortError') {
        console.log(`🚨 Request ${requestId} was aborted (emergency stop)`);
        return res.status(409).json({
          error: 'Request was aborted due to emergency stop',
          sessionId,
          requestId
        });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
});

/**
 * POST /api/multi_agent_system/chat/emergency-stop
 * Emergency stop for a chat session
 */
router.post('/chat/emergency-stop', async (req, res) => {
  try {
    const {
      sessionId,
      systemId,
      userId,
      reason = 'user_emergency_stop'
    } = req.body;

    console.log(`🚨 EMERGENCY STOP requested for session ${sessionId}`);

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing required field: sessionId'
      });
    }

    // Execute emergency stop
    const success = sessionManager.emergencyStop(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found or already stopped',
        sessionId
      });
    }

    console.log(`🚨 Emergency stop completed for session ${sessionId}`);

    res.json({
      success: true,
      sessionId,
      message: 'Emergency stop executed successfully',
      stoppedAt: new Date().toISOString(),
      reason
    });

  } catch (error) {
    console.error('Error executing emergency stop:', error);
    res.status(500).json({
      error: 'Failed to execute emergency stop',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/chat/session/:sessionId/status
 * Get session status and safety information
 */
router.get('/chat/session/:sessionId/status', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    res.json({
      sessionId: session.id,
      status: session.status,
      messageCount: session.messageCount,
      messageLimit: session.messageLimit,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      emergencyStop: session.emergencyStop,
      stopReason: session.stopReason,
      loopDetected: session.loopDetected,
      governanceEnabled: session.governanceEnabled,
      costTracking: session.costTracking
    });

  } catch (error) {
    console.error('Error fetching session status:', error);
    res.status(500).json({
      error: 'Failed to fetch session status',
      details: error.message
    });
  }
});

/**
 * GET /api/multi_agent_system/chat/sessions/active
 * Get all active sessions
 */
router.get('/chat/sessions/active', async (req, res) => {
  try {
    const activeSessions = sessionManager.getActiveSessions();
    const stats = sessionManager.getSessionStats();

    res.json({
      sessions: activeSessions,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      error: 'Failed to fetch active sessions',
      details: error.message
    });
  }
});

/**
 * DELETE /api/multi_agent_system/chat/session/:sessionId
 * Force terminate a session
 */
router.delete('/chat/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'manual_termination' } = req.body;

    const success = sessionManager.terminateSession(sessionId, reason);

    if (!success) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }

    res.json({
      success: true,
      sessionId,
      message: 'Session terminated successfully',
      terminatedAt: new Date().toISOString(),
      reason
    });

  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      details: error.message
    });
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simulate multi-agent response (replace with actual OpenAI integration)
 */
async function simulateMultiAgentResponse(message, session, abortSignal, governanceEnabled) {
  const startTime = Date.now();
  
  // Simulate processing delay
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, 1000 + Math.random() * 2000); // 1-3 seconds
    
    // Handle abort signal
    abortSignal.addEventListener('abort', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
  
  // Check if aborted
  if (abortSignal.aborted) {
    throw new Error('Request was aborted');
  }
  
  // Simulate multi-agent collaboration
  const agentCount = session.metadata?.agentCount || 3;
  const responses = [];
  
  for (let i = 0; i < agentCount; i++) {
    if (abortSignal.aborted) {
      throw new Error('Request was aborted');
    }
    
    responses.push(`Agent ${i + 1}: Response to "${message.substring(0, 50)}..."`);
  }
  
  const finalResponse = responses.join('\n\n');
  
  // Simulate governance data
  const governanceData = governanceEnabled ? {
    approved: true,
    trustScore: 85 + Math.random() * 15,
    violations: [],
    transparencyMessage: 'Multi-agent collaboration completed successfully',
    behaviorTags: ['collaborative', 'consensus_reached']
  } : undefined;
  
  return {
    content: `Multi-Agent System Response:\n\n${finalResponse}\n\n[Processed by ${session.systemName} with ${agentCount} agents using ${session.metadata?.collaborationModel || 'consensus'} collaboration]`,
    governanceData,
    processingTime: Date.now() - startTime,
    agentCount
  };
}

module.exports = router;

