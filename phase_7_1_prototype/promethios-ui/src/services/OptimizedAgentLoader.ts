/**
 * Optimized Agent Loader Service
 * 
 * Provides high-performance agent loading with:
 * - Parallel processing for multiple agents
 * - Smart caching to avoid redundant Firebase calls
 * - Lazy loading for chat history
 * - Performance monitoring and metrics
 */

import { UserAgentStorageService } from './UserAgentStorageService';
import { ChatStorageService } from './ChatStorageService';
import { NativeAgentMigration } from '../utils/NativeAgentMigration';

export interface AgentProfile {
  identity: {
    id: string;
    name: string;
    version: string;
    description: string;
    ownerId: string;
    creationDate: Date;
    lastModifiedDate: Date;
    status: string;
  };
  latestScorecard: any;
  attestationCount: number;
  lastActivity: Date;
  healthStatus: string;
  trustLevel: string;
  isWrapped: boolean;
  governancePolicy: any;
  isDeployed?: boolean;
  apiDetails?: any;
}

export interface LoadingProgress {
  stage: 'initializing' | 'loading_agents' | 'migration' | 'chat_history' | 'complete';
  progress: number; // 0-100
  message: string;
  agentsLoaded: number;
  totalAgents: number;
  timeElapsed: number;
}

export interface OptimizedLoadResult {
  agents: AgentProfile[];
  selectedAgent: AgentProfile | null;
  messages: any[];
  loadingTime: number;
  cacheHit: boolean;
  migrationPerformed: boolean;
}

class OptimizedAgentLoaderService {
  private agentStorageService: UserAgentStorageService;
  private chatStorageService: ChatStorageService;
  private cache: Map<string, { data: AgentProfile[]; timestamp: number; ttl: number }> = new Map();
  private migrationCache: Map<string, boolean> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MIGRATION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.agentStorageService = new UserAgentStorageService();
    this.chatStorageService = new ChatStorageService();
  }

  /**
   * Load agents with optimized performance
   */
  async loadAgentsOptimized(
    userId: string,
    chatMode: string = 'single',
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<OptimizedLoadResult> {
    const startTime = Date.now();
    let cacheHit = false;
    let migrationPerformed = false;

    try {
      // Stage 1: Initialize
      this.reportProgress(onProgress, {
        stage: 'initializing',
        progress: 0,
        message: 'Initializing agent loader...',
        agentsLoaded: 0,
        totalAgents: 0,
        timeElapsed: 0
      });

      // Set user context
      this.agentStorageService.setCurrentUser(userId);
      this.chatStorageService.setCurrentUser(userId);

      // Stage 2: Check cache first
      const cacheKey = `agents:${userId}`;
      const cachedData = this.getCachedAgents(cacheKey);
      
      let agents: AgentProfile[];
      
      if (cachedData) {
        console.log('🚀 OptimizedAgentLoader: Using cached agents');
        agents = cachedData;
        cacheHit = true;
        
        this.reportProgress(onProgress, {
          stage: 'loading_agents',
          progress: 80,
          message: 'Loading agents from cache...',
          agentsLoaded: agents.length,
          totalAgents: agents.length,
          timeElapsed: Date.now() - startTime
        });
      } else {
        // Stage 3: Load agents with parallel processing
        this.reportProgress(onProgress, {
          stage: 'loading_agents',
          progress: 10,
          message: 'Loading agents from storage...',
          agentsLoaded: 0,
          totalAgents: 0,
          timeElapsed: Date.now() - startTime
        });

        // Check if migration is needed (with caching)
        const migrationKey = `migration:${userId}`;
        const migrationNeeded = !this.migrationCache.has(migrationKey);
        
        if (migrationNeeded) {
          this.reportProgress(onProgress, {
            stage: 'migration',
            progress: 20,
            message: 'Checking agent compatibility...',
            agentsLoaded: 0,
            totalAgents: 0,
            timeElapsed: Date.now() - startTime
          });

          try {
            await NativeAgentMigration.autoMigrate(userId);
            this.migrationCache.set(migrationKey, true);
            migrationPerformed = true;
            console.log('✅ OptimizedAgentLoader: Migration completed');
          } catch (migrationError) {
            console.warn('⚠️ OptimizedAgentLoader: Migration warning:', migrationError);
          }
        }

        // Load agents with progress tracking
        this.reportProgress(onProgress, {
          stage: 'loading_agents',
          progress: 40,
          message: 'Fetching agent data...',
          agentsLoaded: 0,
          totalAgents: 0,
          timeElapsed: Date.now() - startTime
        });

        agents = await this.agentStorageService.loadUserAgents() || [];
        
        this.reportProgress(onProgress, {
          stage: 'loading_agents',
          progress: 70,
          message: `Loaded ${agents.length} agents`,
          agentsLoaded: agents.length,
          totalAgents: agents.length,
          timeElapsed: Date.now() - startTime
        });

        // Cache the results
        this.setCachedAgents(cacheKey, agents);
        console.log(`🚀 OptimizedAgentLoader: Cached ${agents.length} agents`);
      }

      // Stage 4: Select agent with persistence logic
      let selectedAgent: AgentProfile | null = null;
      if (agents.length > 0) {
        // Try to restore the last selected agent from localStorage
        const lastSelectedAgentId = this.getLastSelectedAgentId(userId);
        console.log('🔍 OptimizedAgentLoader: Last selected agent ID:', lastSelectedAgentId);
        
        if (lastSelectedAgentId) {
          // Try to find the previously selected agent
          selectedAgent = agents.find(agent => agent.identity.id === lastSelectedAgentId);
          if (selectedAgent) {
            console.log('✅ OptimizedAgentLoader: Restored previously selected agent:', selectedAgent.identity.id);
          } else {
            console.log('⚠️ OptimizedAgentLoader: Previously selected agent not found, falling back to default');
          }
        }
        
        // If no previous agent or it wasn't found, use intelligent selection logic
        if (!selectedAgent) {
          console.log('🔍 OptimizedAgentLoader: No previous agent, using intelligent selection...');
          
          // First, try to find agents with historical data (non-promethios agents that likely have metrics)
          const regularAgents = agents.filter(agent => 
            !agent.identity.id.includes('promethios-llm') && 
            (agent.identity.id.includes('-production') || agent.identity.id.includes('-testing'))
          );
          
          if (regularAgents.length > 0) {
            // Prioritize production agents, then testing agents
            const productionAgents = regularAgents.filter(agent => agent.identity.id.includes('-production'));
            const testingAgents = regularAgents.filter(agent => agent.identity.id.includes('-testing'));
            
            if (productionAgents.length > 0) {
              selectedAgent = productionAgents[0];
              console.log('🎯 OptimizedAgentLoader: Selected production agent with historical data:', selectedAgent.identity.id);
            } else if (testingAgents.length > 0) {
              selectedAgent = testingAgents[0];
              console.log('🎯 OptimizedAgentLoader: Selected testing agent with historical data:', selectedAgent.identity.id);
            }
          }
          
          // If no regular agents found, fall back to original logic
          if (!selectedAgent) {
            if (chatMode === 'promethios-native') {
              selectedAgent = agents.find(agent => 
                agent.identity.name.toLowerCase().includes('promethios') || 
                agent.identity.id.includes('promethios-llm')
              ) || agents[0];
              console.log('🎯 OptimizedAgentLoader: Selected Promethios native agent:', selectedAgent?.identity.id);
            } else {
              selectedAgent = agents[0];
              console.log('🎯 OptimizedAgentLoader: Selected first available agent:', selectedAgent?.identity.id);
            }
          }
        }
        
        // Save the selected agent ID for future sessions
        if (selectedAgent) {
          this.setLastSelectedAgentId(userId, selectedAgent.identity.id);
        }
      }

      // Stage 5: Load chat history (lazy loading - only for selected agent)
      let messages: any[] = [];
      if (selectedAgent && (chatMode === 'single' || chatMode === 'promethios-native')) {
        this.reportProgress(onProgress, {
          stage: 'chat_history',
          progress: 85,
          message: 'Loading chat history...',
          agentsLoaded: agents.length,
          totalAgents: agents.length,
          timeElapsed: Date.now() - startTime
        });

        try {
          const chatHistory = await this.chatStorageService.loadAgentChatHistory(selectedAgent.identity.id);
          if (chatHistory && chatHistory.messages && chatHistory.messages.length > 0) {
            messages = chatHistory.messages.sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }
        } catch (chatError) {
          console.warn('⚠️ OptimizedAgentLoader: Failed to load chat history:', chatError);
        }
      }

      // Stage 6: Complete
      const loadingTime = Date.now() - startTime;
      this.reportProgress(onProgress, {
        stage: 'complete',
        progress: 100,
        message: `Ready! Loaded ${agents.length} agents in ${loadingTime}ms`,
        agentsLoaded: agents.length,
        totalAgents: agents.length,
        timeElapsed: loadingTime
      });

      console.log(`🚀 OptimizedAgentLoader: Complete in ${loadingTime}ms (cache: ${cacheHit}, migration: ${migrationPerformed})`);

      return {
        agents,
        selectedAgent,
        messages,
        loadingTime,
        cacheHit,
        migrationPerformed
      };

    } catch (error) {
      console.error('❌ OptimizedAgentLoader: Failed to load agents:', error);
      throw error;
    }
  }

  /**
   * Load chat history for a specific agent (lazy loading)
   */
  async loadAgentChatHistory(agentId: string): Promise<any[]> {
    try {
      const chatHistory = await this.chatStorageService.loadAgentChatHistory(agentId);
      if (chatHistory && chatHistory.messages && chatHistory.messages.length > 0) {
        return chatHistory.messages.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      }
      return [];
    } catch (error) {
      console.warn('⚠️ OptimizedAgentLoader: Failed to load chat history for agent:', agentId, error);
      return [];
    }
  }

  /**
   * Create a deployed agent profile (for deployed agent mode)
   */
  createDeployedAgentProfile(
    deployedAgentId: string,
    deployedAgentName: string,
    userId: string
  ): AgentProfile {
    return {
      identity: {
        id: deployedAgentId,
        name: deployedAgentName || 'Deployed Agent',
        version: '1.0.0',
        description: 'Production deployed agent',
        ownerId: userId,
        creationDate: new Date(),
        lastModifiedDate: new Date(),
        status: 'active'
      },
      latestScorecard: null,
      attestationCount: 0,
      lastActivity: new Date(),
      healthStatus: 'healthy',
      trustLevel: 'high',
      isWrapped: true,
      governancePolicy: null,
      isDeployed: true,
      apiDetails: {
        endpoint: '',
        key: 'deployed-agent-key',
        provider: 'openai',
        selectedModel: 'gpt-4'
      }
    };
  }

  /**
   * Clear cache for a specific user
   */
  clearCache(userId: string): void {
    const cacheKey = `agents:${userId}`;
    this.cache.delete(cacheKey);
    this.migrationCache.delete(`migration:${userId}`);
    
    // Also clear the last selected agent to force re-evaluation with new logic
    try {
      const agentSelectionKey = `last_selected_agent:${userId}`;
      localStorage.removeItem(agentSelectionKey);
      console.log('🗑️ OptimizedAgentLoader: Cleared last selected agent for re-evaluation');
    } catch (error) {
      console.warn('⚠️ OptimizedAgentLoader: Failed to clear last selected agent:', error);
    }
    
    console.log('🗑️ OptimizedAgentLoader: Cache cleared for user:', userId);
  }

  /**
   * Clear only the agent selection persistence (for testing new selection logic)
   */
  clearAgentSelection(userId: string): void {
    try {
      const agentSelectionKey = `last_selected_agent:${userId}`;
      localStorage.removeItem(agentSelectionKey);
      console.log('🗑️ OptimizedAgentLoader: Cleared agent selection for user:', userId);
    } catch (error) {
      console.warn('⚠️ OptimizedAgentLoader: Failed to clear agent selection:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Private helper methods
  private getCachedAgents(cacheKey: string): AgentProfile[] | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey); // Remove expired cache
    }
    return null;
  }

  private setCachedAgents(cacheKey: string, agents: AgentProfile[]): void {
    this.cache.set(cacheKey, {
      data: agents,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL
    });
  }

  private reportProgress(
    onProgress: ((progress: LoadingProgress) => void) | undefined,
    progress: LoadingProgress
  ): void {
    if (onProgress) {
      onProgress(progress);
    }
  }

  /**
   * Get the last selected agent ID for a user from localStorage
   */
  private getLastSelectedAgentId(userId: string): string | null {
    try {
      const key = `last_selected_agent:${userId}`;
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('⚠️ OptimizedAgentLoader: Failed to get last selected agent ID:', error);
      return null;
    }
  }

  /**
   * Save the last selected agent ID for a user to localStorage
   */
  private setLastSelectedAgentId(userId: string, agentId: string): void {
    try {
      const key = `last_selected_agent:${userId}`;
      localStorage.setItem(key, agentId);
      console.log('💾 OptimizedAgentLoader: Saved last selected agent ID:', agentId);
    } catch (error) {
      console.warn('⚠️ OptimizedAgentLoader: Failed to save last selected agent ID:', error);
    }
  }
}

// Export singleton instance
export const optimizedAgentLoader = new OptimizedAgentLoaderService();
export default optimizedAgentLoader;

