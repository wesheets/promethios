/**
 * API Key Service
 * 
 * Handles API key generation, validation, and management for Promethios agents
 * Follows existing patterns from deploy.js and integrates with agent lifecycle
 */

const crypto = require('crypto');

class ApiKeyService {
  constructor() {
    // In-memory storage for demo - in production, this would be a database
    this.apiKeys = new Map();
    this.userKeys = new Map(); // Maps user_id to array of their API keys
  }

  /**
   * Generate a secure API key for Promethios native agents
   * Format: pm-{agentType}-{timestamp}-{randomString}
   */
  generatePrometheosApiKey(agentId, agentName, userId) {
    const timestamp = Date.now();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const agentType = 'native'; // For native Promethios agents
    
    const apiKey = `pm-${agentType}-${timestamp}-${randomBytes}`;
    
    const keyData = {
      key: apiKey,
      agentId,
      agentName,
      userId,
      type: 'promethios-native',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: 'active',
      permissions: ['chat', 'governance', 'constitutional-compliance'],
      rateLimit: {
        requestsPerMinute: 100,
        requestsPerHour: 1000
      }
    };

    // Store the key
    this.apiKeys.set(apiKey, keyData);
    
    // Add to user's key list
    if (!this.userKeys.has(userId)) {
      this.userKeys.set(userId, []);
    }
    this.userKeys.get(userId).push(keyData);

    console.log(`🔑 Generated API key for agent ${agentName} (${agentId}): ${apiKey.substring(0, 20)}...`);
    
    return keyData;
  }

  /**
   * Generate API key for deployed agents (existing pattern from deploy.js)
   * Format: promethios_{agentId}_{randomString}
   */
  generateDeploymentApiKey(agentId, userId) {
    const randomString = Math.random().toString(36).substr(2, 16);
    const apiKey = `promethios_${agentId}_${randomString}`;
    
    const keyData = {
      key: apiKey,
      agentId,
      userId,
      type: 'deployment',
      createdAt: new Date().toISOString(),
      lastUsed: null,
      status: 'active',
      permissions: ['api-access', 'deployment'],
      rateLimit: {
        requestsPerMinute: 200,
        requestsPerHour: 5000
      }
    };

    this.apiKeys.set(apiKey, keyData);
    
    if (!this.userKeys.has(userId)) {
      this.userKeys.set(userId, []);
    }
    this.userKeys.get(userId).push(keyData);

    console.log(`🚀 Generated deployment API key for agent ${agentId}: ${apiKey.substring(0, 20)}...`);
    
    return keyData;
  }

  /**
   * Validate an API key and return associated data
   */
  validateApiKey(apiKey) {
    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (keyData.status !== 'active') {
      return { valid: false, error: 'API key is inactive' };
    }

    // Update last used timestamp
    keyData.lastUsed = new Date().toISOString();
    this.apiKeys.set(apiKey, keyData);

    return { valid: true, data: keyData };
  }

  /**
   * Get all API keys for a user
   */
  getUserApiKeys(userId) {
    return this.userKeys.get(userId) || [];
  }

  /**
   * Get API key details by key
   */
  getApiKeyDetails(apiKey) {
    return this.apiKeys.get(apiKey) || null;
  }

  /**
   * Revoke an API key
   */
  revokeApiKey(apiKey, userId) {
    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData) {
      return { success: false, error: 'API key not found' };
    }

    if (keyData.userId !== userId) {
      return { success: false, error: 'Unauthorized to revoke this key' };
    }

    keyData.status = 'revoked';
    keyData.revokedAt = new Date().toISOString();
    this.apiKeys.set(apiKey, keyData);

    console.log(`🗑️ Revoked API key: ${apiKey.substring(0, 20)}...`);
    
    return { success: true, message: 'API key revoked successfully' };
  }

  /**
   * Regenerate an API key (revoke old, create new)
   */
  regenerateApiKey(oldApiKey, userId) {
    const oldKeyData = this.apiKeys.get(oldApiKey);
    
    if (!oldKeyData) {
      return { success: false, error: 'API key not found' };
    }

    if (oldKeyData.userId !== userId) {
      return { success: false, error: 'Unauthorized to regenerate this key' };
    }

    // Revoke old key
    this.revokeApiKey(oldApiKey, userId);

    // Generate new key
    let newKeyData;
    if (oldKeyData.type === 'promethios-native') {
      newKeyData = this.generatePrometheosApiKey(
        oldKeyData.agentId, 
        oldKeyData.agentName, 
        userId
      );
    } else {
      newKeyData = this.generateDeploymentApiKey(oldKeyData.agentId, userId);
    }

    console.log(`🔄 Regenerated API key for agent ${oldKeyData.agentId}`);
    
    return { success: true, newKey: newKeyData };
  }

  /**
   * Get API key statistics for a user
   */
  getUserKeyStats(userId) {
    const userKeys = this.getUserApiKeys(userId);
    
    return {
      total: userKeys.length,
      active: userKeys.filter(k => k.status === 'active').length,
      revoked: userKeys.filter(k => k.status === 'revoked').length,
      nativeKeys: userKeys.filter(k => k.type === 'promethios-native').length,
      deploymentKeys: userKeys.filter(k => k.type === 'deployment').length
    };
  }

  /**
   * Check if API key format is valid (without database lookup)
   */
  isValidKeyFormat(apiKey) {
    // Promethios native format: pm-native-{timestamp}-{hex}
    const nativePattern = /^pm-native-\d{13}-[a-f0-9]{32}$/;
    
    // Deployment format: promethios_{agentId}_{randomString}
    const deploymentPattern = /^promethios_[a-zA-Z0-9\-_]+_[a-zA-Z0-9]{16}$/;
    
    return nativePattern.test(apiKey) || deploymentPattern.test(apiKey);
  }

  /**
   * Extract agent ID from API key
   */
  extractAgentIdFromKey(apiKey) {
    if (apiKey.startsWith('pm-native-')) {
      // For native keys, we need to look up the agent ID from storage
      const keyData = this.apiKeys.get(apiKey);
      return keyData ? keyData.agentId : null;
    } else if (apiKey.startsWith('promethios_')) {
      // For deployment keys, agent ID is embedded in the key
      const parts = apiKey.split('_');
      return parts.length >= 2 ? parts[1] : null;
    }
    return null;
  }
}

module.exports = new ApiKeyService();

