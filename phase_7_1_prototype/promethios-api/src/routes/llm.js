const express = require('express');
const router = express.Router();

/**
 * LLM Complete Endpoint
 * 
 * This endpoint handles agent completion requests with optional governance.
 * It wraps external agent APIs and applies governance layers based on the toggle state.
 */

/**
 * POST /api/llm-complete
 * 
 * Complete a message using the specified agent with optional governance.
 * 
 * Request Body:
 * {
 *   "message": "User message to send to the agent",
 *   "agentId": "ID of the agent to use",
 *   "governanceEnabled": true/false,
 *   "governanceLevel": "basic|standard|strict|maximum",
 *   "agentType": "openai|claude|custom",
 *   "apiEndpoint": "External agent API endpoint (optional)"
 * }
 * 
 * Response:
 * {
 *   "response": "Agent response text",
 *   "trustScore": 85,
 *   "violations": [...],
 *   "governanceApplied": true,
 *   "processingTime": 1200
 * }
 */
router.post('/llm-complete', async (req, res) => {
  try {
    const {
      message,
      agentId,
      governanceEnabled = false,
      governanceLevel = 'standard',
      agentType = 'openai',
      apiEndpoint
    } = req.body;

    // Validate required fields
    if (!message || !agentId) {
      return res.status(400).json({
        error: 'Missing required fields: message and agentId'
      });
    }

    const startTime = Date.now();

    // Import agent wrapper service
    const AgentWrapperService = require('../services/agentWrapperService');
    const agentWrapper = new AgentWrapperService();

    // Configure agent wrapper
    await agentWrapper.configure({
      agentId,
      agentType,
      apiEndpoint,
      governanceEnabled,
      governanceLevel
    });

    // Execute the request
    const result = await agentWrapper.complete(message);

    // Add processing time
    result.processingTime = Date.now() - startTime;

    res.json(result);

  } catch (error) {
    console.error('LLM Complete error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/llm-config
 * 
 * Configure LLM provider settings.
 * 
 * Request Body:
 * {
 *   "provider": "openai|claude|custom",
 *   "apiKey": "API key for the provider",
 *   "model": "Model name to use",
 *   "settings": {...}
 * }
 */
router.post('/llm-config', async (req, res) => {
  try {
    const { provider, apiKey, model, settings } = req.body;

    // Validate required fields
    if (!provider) {
      return res.status(400).json({
        error: 'Missing required field: provider'
      });
    }

    // Store configuration (in production, this would be encrypted and stored securely)
    // For now, we'll just validate the configuration
    const validProviders = ['openai', 'claude', 'custom'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider. Must be one of: ' + validProviders.join(', ')
      });
    }

    res.json({
      status: 'success',
      message: 'LLM configuration updated',
      provider,
      model: model || 'default'
    });

  } catch (error) {
    console.error('LLM Config error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

