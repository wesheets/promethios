const express = require('express');
const router = express.Router();

/**
 * Observer Chat Routes
 * 
 * These routes handle interactive chat with the Observer agent using OpenAI.
 * Token usage is tracked and only charged when users actively chat.
 */

// Initialize Observer OpenAI service
const ObserverOpenAIService = require('../services/observerOpenAIService');
const AgentObserverService = require('../services/agentObserverService');

const observerOpenAI = new ObserverOpenAIService();
const agentObserver = new AgentObserverService();

/**
 * Chat with Observer about a specific agent
 * POST /api/observer/chat
 */
router.post('/chat', async (req, res) => {
  try {
    const { agentId, message, agentConfig = {} } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({
        error: 'Missing required fields: agentId and message'
      });
    }

    // Check if Observer OpenAI is available
    if (!observerOpenAI.isAvailable()) {
      return res.status(503).json({
        error: 'Observer chat unavailable - OpenAI API key not configured',
        fallback: 'System insights are still available via /api/observer/insights'
      });
    }

    // Get current system insights for context
    const systemInsights = agentObserver.getAgentInsights(agentId) || {};

    // Chat with Observer using OpenAI
    const result = await observerOpenAI.chatWithObserver(
      agentId, 
      message, 
      systemInsights, 
      agentConfig
    );

    res.json({
      success: true,
      agentId,
      observerResponse: result.response,
      tokenUsage: result.tokenUsage,
      cost: result.cost,
      timestamp: result.timestamp,
      conversationId: result.conversationId
    });

  } catch (error) {
    console.error('Observer chat error:', error);
    res.status(500).json({
      error: 'Observer chat failed',
      message: error.message
    });
  }
});

/**
 * Get Observer analysis for an agent
 * POST /api/observer/analyze
 */
router.post('/analyze', async (req, res) => {
  try {
    const { agentId, agentConfig = {} } = req.body;

    if (!agentId) {
      return res.status(400).json({
        error: 'Missing required field: agentId'
      });
    }

    // Get system insights
    const systemInsights = agentObserver.getAgentInsights(agentId);

    if (!systemInsights) {
      return res.status(404).json({
        error: 'Agent not found or no insights available',
        agentId
      });
    }

    // Get Observer analysis if OpenAI is available
    let observerAnalysis = null;
    if (observerOpenAI.isAvailable()) {
      try {
        observerAnalysis = await observerOpenAI.getObserverAnalysis(
          agentId, 
          systemInsights, 
          agentConfig
        );
      } catch (error) {
        console.error('Observer analysis error:', error);
        // Continue with system insights only
      }
    }

    res.json({
      success: true,
      agentId,
      systemInsights,
      observerAnalysis,
      hasOpenAIAnalysis: !!observerAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer analysis error:', error);
    res.status(500).json({
      error: 'Observer analysis failed',
      message: error.message
    });
  }
});

/**
 * Get system insights for an agent (free)
 * GET /api/observer/insights/:agentId
 */
router.get('/insights/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const insights = agentObserver.getAgentInsights(agentId);

    if (!insights) {
      return res.status(404).json({
        error: 'Agent not found or no insights available',
        agentId
      });
    }

    res.json({
      success: true,
      agentId,
      insights,
      cost: 'free',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer insights error:', error);
    res.status(500).json({
      error: 'Failed to get observer insights',
      message: error.message
    });
  }
});

/**
 * Get conversation history with Observer for an agent
 * GET /api/observer/conversation/:agentId
 */
router.get('/conversation/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const conversation = observerOpenAI.getConversationHistory(agentId);
    const tokenUsage = observerOpenAI.getTokenUsage(agentId);

    res.json({
      success: true,
      agentId,
      conversation,
      tokenUsage,
      messageCount: conversation.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer conversation error:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      message: error.message
    });
  }
});

/**
 * Clear conversation history for an agent
 * DELETE /api/observer/conversation/:agentId
 */
router.delete('/conversation/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    observerOpenAI.clearConversationHistory(agentId);

    res.json({
      success: true,
      agentId,
      message: 'Conversation history cleared',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer conversation clear error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation history',
      message: error.message
    });
  }
});

/**
 * Get token usage statistics for an agent
 * GET /api/observer/usage/:agentId
 */
router.get('/usage/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;

    const usage = observerOpenAI.getTokenUsage(agentId);

    res.json({
      success: true,
      agentId,
      tokenUsage: usage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer usage error:', error);
    res.status(500).json({
      error: 'Failed to get token usage',
      message: error.message
    });
  }
});

/**
 * Get total Observer service status and usage
 * GET /api/observer/status
 */
router.get('/status', async (req, res) => {
  try {
    const status = observerOpenAI.getStatus();
    const totalUsage = observerOpenAI.getTotalTokenUsage();

    res.json({
      success: true,
      observerStatus: status,
      totalTokenUsage: totalUsage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Observer status error:', error);
    res.status(500).json({
      error: 'Failed to get observer status',
      message: error.message
    });
  }
});

module.exports = router;

