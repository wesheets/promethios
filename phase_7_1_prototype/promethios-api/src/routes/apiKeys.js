/**
 * API Keys Management Routes
 * 
 * Handles API key CRUD operations for the management interface
 * Integrates with the ApiKeyService for key generation and validation
 */

const express = require('express');
const router = express.Router();
const apiKeyService = require('../services/apiKeyService');

/**
 * Get all API keys for a user
 * GET /api/keys?userId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log(`🔑 Getting API keys for user: ${userId}`);
    
    const apiKeys = apiKeyService.getUserApiKeys(userId);
    const stats = apiKeyService.getUserKeyStats(userId);
    
    // Don't expose full keys in list view - only show partial keys
    const safeKeys = apiKeys.map(key => ({
      ...key,
      key: `${key.key.substring(0, 12)}...${key.key.substring(key.key.length - 4)}`,
      keyId: key.key // Keep full key as keyId for operations
    }));
    
    res.status(200).json({
      success: true,
      keys: safeKeys,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error getting API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API keys',
      message: error.message
    });
  }
});

/**
 * Get specific API key details
 * GET /api/keys/:keyId
 */
router.get('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log(`🔍 Getting API key details: ${keyId.substring(0, 12)}...`);
    
    const keyData = apiKeyService.getApiKeyDetails(keyId);
    
    if (!keyData) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    if (keyData.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to access this API key'
      });
    }
    
    res.status(200).json({
      success: true,
      key: keyData
    });
    
  } catch (error) {
    console.error('❌ Error getting API key details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API key details',
      message: error.message
    });
  }
});

/**
 * Generate a new API key for an agent
 * POST /api/keys/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const { agentId, agentName, userId, keyType = 'promethios-native' } = req.body;
    
    if (!agentId || !agentName || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID, agent name, and user ID are required'
      });
    }

    console.log(`🔑 Generating ${keyType} API key for agent: ${agentName} (${agentId})`);
    
    let keyData;
    if (keyType === 'promethios-native') {
      keyData = apiKeyService.generatePrometheosApiKey(agentId, agentName, userId);
    } else if (keyType === 'deployment') {
      keyData = apiKeyService.generateDeploymentApiKey(agentId, userId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid key type. Must be "promethios-native" or "deployment"'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      key: keyData
    });
    
  } catch (error) {
    console.error('❌ Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key',
      message: error.message
    });
  }
});

/**
 * Revoke an API key
 * DELETE /api/keys/:keyId
 */
router.delete('/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log(`🗑️ Revoking API key: ${keyId.substring(0, 12)}...`);
    
    const result = apiKeyService.revokeApiKey(keyId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json(result);
    
  } catch (error) {
    console.error('❌ Error revoking API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
      message: error.message
    });
  }
});

/**
 * Regenerate an API key
 * POST /api/keys/:keyId/regenerate
 */
router.post('/:keyId/regenerate', async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log(`🔄 Regenerating API key: ${keyId.substring(0, 12)}...`);
    
    const result = apiKeyService.regenerateApiKey(keyId, userId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.status(200).json({
      success: true,
      message: 'API key regenerated successfully',
      newKey: result.newKey
    });
    
  } catch (error) {
    console.error('❌ Error regenerating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key',
      message: error.message
    });
  }
});

/**
 * Validate an API key
 * POST /api/keys/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    console.log(`🔍 Validating API key: ${apiKey.substring(0, 12)}...`);
    
    const validation = apiKeyService.validateApiKey(apiKey);
    
    res.status(200).json({
      success: true,
      valid: validation.valid,
      error: validation.error || null,
      data: validation.data || null
    });
    
  } catch (error) {
    console.error('❌ Error validating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
      message: error.message
    });
  }
});

/**
 * Get API key statistics for a user
 * GET /api/keys/stats?userId=xxx
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    console.log(`📊 Getting API key stats for user: ${userId}`);
    
    const stats = apiKeyService.getUserKeyStats(userId);
    
    res.status(200).json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error getting API key stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API key statistics',
      message: error.message
    });
  }
});

module.exports = router;

