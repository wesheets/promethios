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
    console.log(`🔑 Starting API key generation for agent: ${agentName} (${agentId}), user: ${userId}`);
    
    try {
      const timestamp = Date.now();
      const randomBytes = crypto.randomBytes(16).toString('hex');
      const agentType = 'native'; // For native Promethios agents
      
      const apiKey = `pm-${agentType}-${timestamp}-${randomBytes}`;
      console.log(`🔑 Generated API key: ${apiKey.substring(0, 20)}...`);
      
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
      
      console.log(`🔑 Prepared key data:`, { ...keyData, key: `${keyData.key.substring(0, 20)}...` });

      // Store the key in Firestore
      console.log(`🔑 Storing key in apiKeys collection...`);
      await this.apiKeysCollection.doc(apiKey).set(keyData);
      console.log(`🔑 Key stored successfully in apiKeys collection`);
      
      // Add to user's key list
      console.log(`🔑 Adding key to user's key list...`);
      const userKeysRef = this.userKeysCollection.doc(userId);
      const userKeysDoc = await userKeysRef.get();
      
      if (userKeysDoc.exists) {
        console.log(`🔑 User has existing keys, updating list...`);
        const userData = userKeysDoc.data();
        const updatedKeys = [...(userData.keys || []), keyData];
        await userKeysRef.update({ keys: updatedKeys });
        console.log(`🔑 User key list updated successfully`);
      } else {
        console.log(`🔑 Creating new user key list...`);
        await userKeysRef.set({ keys: [keyData] });
        console.log(`🔑 New user key list created successfully`);
      }

      console.log(`🔑 API key generation completed successfully for agent ${agentName} (${agentId})`);
      
      return keyData;
    } catch (error) {
      console.error('🔑 Error generating API key:', error);
      console.error('🔑 Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
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
      
      // First, try to get keys from the new userApiKeys collection
      const userKeysDoc = await this.userKeysCollection.doc(userId).get();
      let keys = [];
      
      if (userKeysDoc.exists) {
        const userData = userKeysDoc.data();
        keys = userData.keys || [];
        console.log(`🔑 Found ${keys.length} API keys in userApiKeys collection`);
      }
      
      // Also check for API keys stored in the agents collection (legacy format)
      try {
        const agentsCollection = db.collection('agents');
        const agentKeysQuery = await agentsCollection.where('__name__', '>=', `api-key-${userId}_`).where('__name__', '<', `api-key-${userId}_\uf8ff`).get();
        
        console.log(`🔑 Found ${agentKeysQuery.size} API keys in agents collection`);
        
        agentKeysQuery.forEach(doc => {
          const keyData = doc.data();
          const keyId = doc.id.replace(`api-key-${userId}_`, '');
          
          // Convert legacy format to new format
          const convertedKey = {
            key: keyData.key || `pm-legacy-${Date.now()}-${keyId}`,
            agentId: keyData.agentId || keyId,
            agentName: keyData.agentName || 'Legacy Agent',
            userId: userId,
            type: 'promethios-native',
            createdAt: keyData.createdAt || new Date().toISOString(),
            lastUsed: keyData.lastUsed || null,
            status: keyData.status || 'active',
            permissions: keyData.permissions || ['chat', 'governance'],
            rateLimit: keyData.rateLimit || {
              requestsPerMinute: 100,
              requestsPerHour: 1000
            }
          };
          
          keys.push(convertedKey);
        });
      } catch (legacyError) {
        console.warn('🔑 Error reading legacy API keys:', legacyError);
      }
      
      console.log(`🔑 Total API keys found for user ${userId}: ${keys.length}`);
      
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

