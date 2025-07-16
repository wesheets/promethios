/**
 * API Key Service
 * 
 * Handles API key generation, validation, and management for Promethios agents
 * Uses Firestore for persistent storage
 */

const crypto = require('crypto');
const { db } = require('../config/firebase');

class ApiKeyService {
  constructor() {
    this.apiKeysCollection = db.collection('apiKeys');
    this.userKeysCollection = db.collection('userApiKeys');
    
    console.log('🔑 API Key Service initialized with Firestore storage');
  }

  /**
   * Generate a secure API key for Promethios native agents
   * Format: pm-{agentType}-{timestamp}-{randomString}
   */
  async generatePrometheosApiKey(agentId, agentName, userId) {
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

    try {
      // Store the key in Firestore
      await this.apiKeysCollection.doc(apiKey).set(keyData);
      
      // Add to user's key list
      const userKeysRef = this.userKeysCollection.doc(userId);
      const userKeysDoc = await userKeysRef.get();
      
      if (userKeysDoc.exists) {
        const userData = userKeysDoc.data();
        const updatedKeys = [...(userData.keys || []), keyData];
        await userKeysRef.update({ keys: updatedKeys });
      } else {
        await userKeysRef.set({ keys: [keyData] });
      }

      console.log(`🔑 Generated API key for agent ${agentName} (${agentId}): ${apiKey.substring(0, 20)}...`);
      
      return keyData;
    } catch (error) {
      console.error('🔑 Error generating API key:', error);
      throw error;
    }
  }

  /**
   * Generate API key for deployed agents (existing pattern from deploy.js)
   * Format: promethios_{agentId}_{randomString}
   */
  async generateDeploymentApiKey(agentId, userId) {
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

    try {
      // Store the key in Firestore
      await this.apiKeysCollection.doc(apiKey).set(keyData);
      
      // Add to user's key list
      const userKeysRef = this.userKeysCollection.doc(userId);
      const userKeysDoc = await userKeysRef.get();
      
      if (userKeysDoc.exists) {
        const userData = userKeysDoc.data();
        const updatedKeys = [...(userData.keys || []), keyData];
        await userKeysRef.update({ keys: updatedKeys });
      } else {
        await userKeysRef.set({ keys: [keyData] });
      }

      console.log(`🚀 Generated deployment API key for agent ${agentId}: ${apiKey.substring(0, 20)}...`);
      
      return keyData;
    } catch (error) {
      console.error('🚀 Error generating deployment API key:', error);
      throw error;
    }
  }

  /**
   * Validate an API key and return associated data
   */
  async validateApiKey(apiKey) {
    try {
      const keyDoc = await this.apiKeysCollection.doc(apiKey).get();
      
      if (!keyDoc.exists) {
        return { valid: false, error: 'Invalid API key' };
      }

      const keyData = keyDoc.data();
      
      if (keyData.status !== 'active') {
        return { valid: false, error: 'API key is inactive' };
      }

      // Update last used timestamp
      await this.apiKeysCollection.doc(apiKey).update({
        lastUsed: new Date().toISOString()
      });

      return { valid: true, data: keyData };
    } catch (error) {
      console.error('🔍 Error validating API key:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId) {
    try {
      console.log(`🔑 Getting API keys for user: ${userId}`);
      
      const userKeysDoc = await this.userKeysCollection.doc(userId).get();
      
      if (!userKeysDoc.exists) {
        console.log(`🔑 No API keys found for user: ${userId}`);
        return [];
      }

      const userData = userKeysDoc.data();
      const keys = userData.keys || [];
      
      console.log(`🔑 Found ${keys.length} API keys for user: ${userId}`);
      
      return keys;
    } catch (error) {
      console.error('🔑 Error getting user API keys:', error);
      return [];
    }
  }

  /**
   * Get API key details by key
   */
  async getApiKeyDetails(apiKey) {
    try {
      const keyDoc = await this.apiKeysCollection.doc(apiKey).get();
      
      if (!keyDoc.exists) {
        return null;
      }

      return keyDoc.data();
    } catch (error) {
      console.error('🔍 Error getting API key details:', error);
      return null;
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKey, userId) {
    try {
      const keyDoc = await this.apiKeysCollection.doc(apiKey).get();
      
      if (!keyDoc.exists) {
        return { success: false, error: 'API key not found' };
      }

      const keyData = keyDoc.data();
      
      if (keyData.userId !== userId) {
        return { success: false, error: 'Unauthorized to revoke this key' };
      }

      // Update key status
      await this.apiKeysCollection.doc(apiKey).update({
        status: 'revoked',
        revokedAt: new Date().toISOString()
      });

      // Update user's key list
      const userKeysRef = this.userKeysCollection.doc(userId);
      const userKeysDoc = await userKeysRef.get();
      
      if (userKeysDoc.exists) {
        const userData = userKeysDoc.data();
        const updatedKeys = (userData.keys || []).map(key => 
          key.key === apiKey 
            ? { ...key, status: 'revoked', revokedAt: new Date().toISOString() }
            : key
        );
        await userKeysRef.update({ keys: updatedKeys });
      }

      console.log(`🗑️ Revoked API key: ${apiKey.substring(0, 20)}...`);
      
      return { success: true, message: 'API key revoked successfully' };
    } catch (error) {
      console.error('🗑️ Error revoking API key:', error);
      return { success: false, error: 'Failed to revoke API key' };
    }
  }

  /**
   * Regenerate an API key (revoke old, create new)
   */
  async regenerateApiKey(oldApiKey, userId) {
    try {
      const oldKeyDoc = await this.apiKeysCollection.doc(oldApiKey).get();
      
      if (!oldKeyDoc.exists) {
        return { success: false, error: 'API key not found' };
      }

      const oldKeyData = oldKeyDoc.data();
      
      if (oldKeyData.userId !== userId) {
        return { success: false, error: 'Unauthorized to regenerate this key' };
      }

      // Revoke old key
      await this.revokeApiKey(oldApiKey, userId);

      // Generate new key
      let newKeyData;
      if (oldKeyData.type === 'promethios-native') {
        newKeyData = await this.generatePrometheosApiKey(
          oldKeyData.agentId, 
          oldKeyData.agentName, 
          userId
        );
      } else {
        newKeyData = await this.generateDeploymentApiKey(oldKeyData.agentId, userId);
      }

      console.log(`🔄 Regenerated API key for agent ${oldKeyData.agentId}`);
      
      return { success: true, newKey: newKeyData };
    } catch (error) {
      console.error('🔄 Error regenerating API key:', error);
      return { success: false, error: 'Failed to regenerate API key' };
    }
  }

  /**
   * Get API key statistics for a user
   */
  async getUserKeyStats(userId) {
    try {
      const userKeys = await this.getUserApiKeys(userId);
      
      return {
        total: userKeys.length,
        active: userKeys.filter(k => k.status === 'active').length,
        revoked: userKeys.filter(k => k.status === 'revoked').length,
        nativeKeys: userKeys.filter(k => k.type === 'promethios-native').length,
        deploymentKeys: userKeys.filter(k => k.type === 'deployment').length
      };
    } catch (error) {
      console.error('📊 Error getting user key stats:', error);
      return {
        total: 0,
        active: 0,
        revoked: 0,
        nativeKeys: 0,
        deploymentKeys: 0
      };
    }
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
      return this.getApiKeyDetails(apiKey).then(keyData => 
        keyData ? keyData.agentId : null
      );
    } else if (apiKey.startsWith('promethios_')) {
      // For deployment keys, agent ID is embedded in the key
      const parts = apiKey.split('_');
      return parts.length >= 2 ? parts[1] : null;
    }
    return null;
  }

  /**
   * Initialize sample data for testing (if needed)
   */
  async initializeSampleDataIfNeeded(userId) {
    try {
      const existingKeys = await this.getUserApiKeys(userId);
      
      if (existingKeys.length > 0) {
        console.log(`🔑 User ${userId} already has ${existingKeys.length} API keys`);
        return;
      }

      console.log(`🔑 Initializing sample API keys for user: ${userId}`);
      
      // Create sample API keys
      const sampleAgents = [
        { agentId: 'agent-001', agentName: 'Promethios Assistant' },
        { agentId: 'agent-002', agentName: 'Constitutional Advisor' },
        { agentId: 'agent-003', agentName: 'Policy Analyst' }
      ];

      for (const agent of sampleAgents) {
        await this.generatePrometheosApiKey(agent.agentId, agent.agentName, userId);
      }

      // Also create one deployment key
      await this.generateDeploymentApiKey('agent-004', userId);
      
      console.log(`🔑 Initialized ${sampleAgents.length + 1} sample API keys for user ${userId}`);
    } catch (error) {
      console.error('🔑 Error initializing sample data:', error);
    }
  }
}

module.exports = new ApiKeyService();

