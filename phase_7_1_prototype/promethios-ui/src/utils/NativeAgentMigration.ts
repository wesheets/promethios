/**
 * Migration utility to fix existing Promethios Native Agents with proper apiDetails structure
 */

import { UserAgentStorageService } from '../services/UserAgentStorageService';
import { AgentProfile } from '../types/AgentTypes';

export class NativeAgentMigration {
  private storageService: UserAgentStorageService;

  constructor() {
    this.storageService = new UserAgentStorageService();
  }

  /**
   * Migrate all existing native agents to have proper apiDetails structure
   */
  async migrateNativeAgents(userId: string): Promise<{ migrated: number; errors: string[] }> {
    console.log('🔧 Starting native agent migration for user:', userId);
    
    this.storageService.setCurrentUser(userId);
    const errors: string[] = [];
    let migrated = 0;

    try {
      // Load all agents for the user
      const agents = await this.storageService.loadUserAgents();
      console.log(`📋 Found ${agents.length} total agents`);

      // Filter for native agents that need migration
      console.log('🔍 Analyzing agents for migration needs...');
      agents.forEach(agent => {
        const isNativeAgent = agent.prometheosLLM && (typeof agent.prometheosLLM === 'object' || agent.prometheosLLM === true);
        console.log(`🔍 Agent "${agent.identity.name}":`, {
          prometheosLLM: agent.prometheosLLM,
          isNativeAgent: isNativeAgent,
          hasApiDetails: !!agent.apiDetails,
          hasProvider: agent.apiDetails?.provider,
          hasKey: !!agent.apiDetails?.key,
          needsMigration: isNativeAgent && 
                         (!agent.apiDetails || !agent.apiDetails.provider || !agent.apiDetails.key)
        });
      });
      
      const nativeAgents = agents.filter(agent => {
        const isNativeAgent = agent.prometheosLLM && (typeof agent.prometheosLLM === 'object' || agent.prometheosLLM === true);
        return isNativeAgent && 
               (!agent.apiDetails || !agent.apiDetails.provider || !agent.apiDetails.key);
      });

      console.log(`🎯 Found ${nativeAgents.length} native agents needing migration`);

      for (const agent of nativeAgents) {
        try {
          console.log(`🔄 Migrating native agent: ${agent.identity.name} (${agent.agentId})`);
          
          // Create proper apiDetails structure for native agents using the static method
          const migratedAgent: AgentProfile = {
            ...agent,
            apiDetails: NativeAgentMigration.createNativeApiDetails(
              agent.identity.name,
              agent.identity.description
            )
          };

          // Save the migrated agent
          await this.storageService.saveAgent(migratedAgent);
          migrated++;
          
          console.log(`✅ Successfully migrated: ${agent.identity.name}`);
          
        } catch (error) {
          const errorMsg = `Failed to migrate agent ${agent.identity.name}: ${error instanceof Error ? error.message : String(error)}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      console.log(`🎉 Migration complete! Migrated ${migrated} agents with ${errors.length} errors`);
      
      return { migrated, errors };
      
    } catch (error) {
      const errorMsg = `Migration failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error('💥', errorMsg);
      errors.push(errorMsg);
      return { migrated, errors };
    }
  }

  /**
   * Check if a native agent needs migration
   */
  static needsMigration(agent: AgentProfile): boolean {
    const isNativeAgent = agent.prometheosLLM && (typeof agent.prometheosLLM === 'object' || agent.prometheosLLM === true);
    
    // Force re-migration for all native agents to ensure they have correct Promethios config
    if (isNativeAgent) {
      // Check if it still has OpenAI config (needs migration)
      const hasOpenAIConfig = agent.apiDetails?.provider === 'openai' || 
                             agent.apiDetails?.endpoint?.includes('openai.com') ||
                             agent.apiDetails?.selectedModel === 'gpt-4';
      
      // Always migrate if it's a native agent without proper Promethios config
      return !agent.apiDetails || 
             !agent.apiDetails.provider || 
             !agent.apiDetails.key ||
             !agent.apiDetails.endpoint ||
             hasOpenAIConfig ||
             agent.apiDetails.provider !== 'promethios';
    }
    
    return false;
  }

  /**
   * Create proper apiDetails structure for a new native agent
   * This method should be called after API key generation in PrometheosLLMExtension
   */
  static createNativeApiDetails(name: string, description: string, apiKeyData?: any) {
    // If we have real API key data from the backend, use it
    if (apiKeyData && apiKeyData.key) {
      return {
        endpoint: 'https://api.promethios.ai/v1',
        key: apiKeyData.key,
        provider: 'promethios',
        selectedModel: 'promethios-lambda-7b',
        selectedCapabilities: ['text-generation', 'conversation', 'governance', 'constitutional-compliance'],
        selectedContextLength: 8192,
        discoveredInfo: {
          name: name,
          description: description,
          type: 'native-llm',
          governance: 'built-in',
          compliance: 'constitutional',
          provider: 'promethios-native',
          apiKeyId: apiKeyData.key,
          keyType: apiKeyData.type,
          permissions: apiKeyData.permissions,
          rateLimit: apiKeyData.rateLimit
        }
      };
    }
    
    // Fallback for existing agents without real API keys
    return {
      endpoint: 'https://api.promethios.ai/v1',
      key: process.env.REACT_APP_PROMETHIOS_API_KEY || 'native-model-key',
      provider: 'promethios',
      selectedModel: 'promethios-lambda-7b',
      selectedCapabilities: ['text-generation', 'conversation', 'governance', 'constitutional-compliance'],
      selectedContextLength: 8192,
      discoveredInfo: {
        name: name,
        description: description,
        type: 'native-llm',
        governance: 'built-in',
        compliance: 'constitutional',
        provider: 'promethios-native'
      }
    };
  }

  /**
   * Run migration automatically when needed
   */
  static async autoMigrate(userId: string): Promise<void> {
    const migration = new NativeAgentMigration();
    const result = await migration.migrateNativeAgents(userId);
    
    if (result.migrated > 0) {
      console.log(`🚀 Auto-migration completed: ${result.migrated} agents updated`);
    }
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Migration had errors:', result.errors);
    }
  }
}

