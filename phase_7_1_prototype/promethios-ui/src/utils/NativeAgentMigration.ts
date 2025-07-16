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
        console.log(`🔍 Agent "${agent.identity.name}":`, {
          prometheosLLM: agent.prometheosLLM,
          hasApiDetails: !!agent.apiDetails,
          hasProvider: agent.apiDetails?.provider,
          hasKey: !!agent.apiDetails?.key,
          needsMigration: agent.prometheosLLM === true && 
                         (!agent.apiDetails || !agent.apiDetails.provider || !agent.apiDetails.key)
        });
      });
      
      const nativeAgents = agents.filter(agent => 
        agent.prometheosLLM === true && 
        (!agent.apiDetails || !agent.apiDetails.provider || !agent.apiDetails.key)
      );

      console.log(`🎯 Found ${nativeAgents.length} native agents needing migration`);

      for (const agent of nativeAgents) {
        try {
          console.log(`🔄 Migrating native agent: ${agent.identity.name} (${agent.agentId})`);
          
          // Create proper apiDetails structure for native agents
          const migratedAgent: AgentProfile = {
            ...agent,
            apiDetails: {
              endpoint: 'https://api.openai.com/v1',
              key: process.env.REACT_APP_OPENAI_API_KEY || '',
              provider: 'openai', // Lowercase to match chat system expectations
              selectedModel: 'gpt-4',
              selectedCapabilities: ['text-generation', 'conversation', 'governance'],
              selectedContextLength: 8192,
              discoveredInfo: {
                name: agent.identity.name,
                description: agent.identity.description,
                type: 'native-llm',
                governance: 'built-in',
                compliance: 'constitutional'
              }
            }
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
    return agent.prometheosLLM === true && 
           (!agent.apiDetails || 
            !agent.apiDetails.provider || 
            !agent.apiDetails.key ||
            !agent.apiDetails.endpoint);
  }

  /**
   * Create proper apiDetails structure for a new native agent
   */
  static createNativeApiDetails(name: string, description: string) {
    return {
      endpoint: 'https://api.openai.com/v1',
      key: process.env.REACT_APP_OPENAI_API_KEY || '',
      provider: 'openai', // Lowercase to match chat system expectations
      selectedModel: 'gpt-4',
      selectedCapabilities: ['text-generation', 'conversation', 'governance'],
      selectedContextLength: 8192,
      discoveredInfo: {
        name: name,
        description: description,
        type: 'native-llm',
        governance: 'built-in',
        compliance: 'constitutional'
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

