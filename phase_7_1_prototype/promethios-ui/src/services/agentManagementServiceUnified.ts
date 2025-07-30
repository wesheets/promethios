/**
 * Agent Management Service with Unified Storage Integration
 * 
 * Enhanced service that integrates the existing agent management system with the unified storage system
 * for persistent agent data, wrapper configurations, and multi-agent coordination.
 */

import { storageExtension } from '../extensions/StorageExtension';
import { unifiedStorage } from './UnifiedStorageService';
import { AgentWrapper, WrapperMetrics } from '../modules/agent-wrapping/types';
import { MultiAgentService, MultiAgentContext, AgentMessage } from './multiAgentService';
import { AgentProfile } from '../modules/agent-identity/types/multiAgent';
import { useAgentCreatedHook } from '../hooks/LifecycleHooks';

// Enhanced types for storage integration
interface StoredAgentWrapper extends AgentWrapper {
  userId: string;
  createdAt: number;
  lastModified: number;
  isActive: boolean;
  deploymentStatus: 'draft' | 'deployed' | 'suspended' | 'archived';
  usageMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastUsed: number;
  };
  governanceData: {
    trustScore: number;
    complianceScore: number;
    violations: number;
    lastAudit: number;
  };
}

interface StoredAgentProfile extends AgentProfile {
  userId: string;
  createdAt: number;
  lastModified: number;
  wrapperIds: string[];
  collaborationHistory: {
    contextId: string;
    participantCount: number;
    messageCount: number;
    lastActivity: number;
  }[];
}

interface StoredMultiAgentContext extends MultiAgentContext {
  userId: string;
  persistentData: {
    sharedMemory: Record<string, any>;
    conversationHistory: AgentMessage[];
    collaborationMetrics: any;
  };
  lastActivity: number;
}

interface AgentManagementMetrics {
  totalAgents: number;
  activeWrappers: number;
  multiAgentContexts: number;
  totalRequests: number;
  averageTrustScore: number;
  complianceRate: number;
}

class AgentManagementServiceUnified {
  private multiAgentService: MultiAgentService;
  private userId: string = '';
  private isStorageReady: boolean = false;

  constructor() {
    this.multiAgentService = new MultiAgentService();
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    try {
      // Wait for storage extension to be ready
      await storageExtension.initialize();
      this.isStorageReady = true;
      console.log('Agent Management storage integration initialized');
    } catch (error) {
      console.error('Failed to initialize Agent Management storage:', error);
      this.isStorageReady = false;
    }
  }

  async setUserId(userId: string): Promise<void> {
    this.userId = userId;
    
    // Initialize user's agent namespace if it doesn't exist
    if (this.isStorageReady) {
      try {
        const existingAgents = await this.getStoredAgentWrappers();
        console.log(`Initialized agent management for user ${userId}, found ${existingAgents.length} existing agents`);
      } catch (error) {
        console.error('Failed to initialize user agent namespace:', error);
      }
    }
  }

  // Agent Wrapper Management
  async createAgentWrapper(wrapper: AgentWrapper): Promise<string> {
    if (!this.isStorageReady || !this.userId) {
      throw new Error('Storage not ready or user not set');
    }

    const wrapperId = `wrapper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedWrapper: StoredAgentWrapper = {
      ...wrapper,
      id: wrapperId,
      userId: this.userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      isActive: true,
      deploymentStatus: 'draft',
      usageMetrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: 0
      },
      governanceData: {
        trustScore: 100, // Start with perfect trust
        complianceScore: 100,
        violations: 0,
        lastAudit: Date.now()
      }
    };

    try {
      await storageExtension.set('agents', `wrapper_${wrapperId}`, storedWrapper);
      console.log('Agent wrapper created and stored:', wrapperId);

      // NEW: Trigger lifecycle event for agent creation
      try {
        // Convert StoredAgentWrapper to AgentProfile format for lifecycle tracking
        const agentProfile: any = {
          identity: {
            id: wrapperId,
            name: wrapper.name || `Agent Wrapper ${wrapperId}`,
            version: '1.0.0',
            description: wrapper.description || 'Agent wrapper created via unified management service',
            ownerId: this.userId,
            creationDate: new Date(storedWrapper.createdAt),
            lastModifiedDate: new Date(storedWrapper.lastModified),
            status: 'active'
          }
        };

        await useAgentCreatedHook(agentProfile);
        console.log('✅ Lifecycle event triggered for agent wrapper creation:', wrapperId);
      } catch (lifecycleError) {
        // Log but don't fail the creation process
        console.warn('⚠️ Failed to trigger lifecycle event for agent wrapper creation:', lifecycleError);
      }

      return wrapperId;
    } catch (error) {
      console.error('Failed to create agent wrapper:', error);
      throw error;
    }
  }

  async getAgentWrapper(wrapperId: string): Promise<StoredAgentWrapper | null> {
    if (!this.isStorageReady) return null;

    try {
      const wrapper = await storageExtension.get<StoredAgentWrapper>('agents', `wrapper_${wrapperId}`);
      return wrapper && wrapper.userId === this.userId ? wrapper : null;
    } catch (error) {
      console.error('Failed to get agent wrapper:', error);
      return null;
    }
  }

  async updateAgentWrapper(wrapperId: string, updates: Partial<StoredAgentWrapper>): Promise<void> {
    if (!this.isStorageReady || !this.userId) return;

    try {
      const existingWrapper = await this.getAgentWrapper(wrapperId);
      if (!existingWrapper) {
        throw new Error('Agent wrapper not found');
      }

      const updatedWrapper: StoredAgentWrapper = {
        ...existingWrapper,
        ...updates,
        lastModified: Date.now()
      };

      await storageExtension.set('agents', `wrapper_${wrapperId}`, updatedWrapper);
      console.log('Agent wrapper updated:', wrapperId);
    } catch (error) {
      console.error('Failed to update agent wrapper:', error);
      throw error;
    }
  }

  async deleteAgentWrapper(wrapperId: string): Promise<void> {
    if (!this.isStorageReady || !this.userId) return;

    try {
      const wrapper = await this.getAgentWrapper(wrapperId);
      if (!wrapper) {
        throw new Error('Agent wrapper not found');
      }

      await storageExtension.delete('agents', `wrapper_${wrapperId}`);
      console.log('Agent wrapper deleted:', wrapperId);
    } catch (error) {
      console.error('Failed to delete agent wrapper:', error);
      throw error;
    }
  }

  async getStoredAgentWrappers(): Promise<StoredAgentWrapper[]> {
    if (!this.isStorageReady || !this.userId) return [];

    try {
      const keys = await unifiedStorage.keys('agents');
      const wrapperKeys = keys.filter(key => key.startsWith('wrapper_'));
      
      const wrappers: StoredAgentWrapper[] = [];
      
      for (const key of wrapperKeys) {
        const wrapper = await storageExtension.get<StoredAgentWrapper>('agents', key);
        if (wrapper && wrapper.userId === this.userId) {
          wrappers.push(wrapper);
        }
      }

      // Sort by last modified (most recent first)
      return wrappers.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('Failed to get stored agent wrappers:', error);
      return [];
    }
  }

  // Agent Profile Management
  async createAgentProfile(profile: Omit<AgentProfile, 'id'>): Promise<string> {
    if (!this.isStorageReady || !this.userId) {
      throw new Error('Storage not ready or user not set');
    }

    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedProfile: StoredAgentProfile = {
      ...profile,
      id: profileId,
      userId: this.userId,
      createdAt: Date.now(),
      lastModified: Date.now(),
      wrapperIds: [],
      collaborationHistory: []
    };

    try {
      await storageExtension.set('agents', `profile_${profileId}`, storedProfile);
      console.log('Agent profile created and stored:', profileId);

      // NEW: Trigger lifecycle event for agent creation
      try {
        // Convert StoredAgentProfile to AgentProfile format for lifecycle tracking
        const agentProfile: any = {
          identity: {
            id: profileId,
            name: profile.name || `Agent Profile ${profileId}`,
            version: '1.0.0',
            description: profile.description || 'Agent profile created via unified management service',
            ownerId: this.userId,
            creationDate: new Date(storedProfile.createdAt),
            lastModifiedDate: new Date(storedProfile.lastModified),
            status: 'active'
          }
        };

        await useAgentCreatedHook(agentProfile);
        console.log('✅ Lifecycle event triggered for agent profile creation:', profileId);
      } catch (lifecycleError) {
        // Log but don't fail the creation process
        console.warn('⚠️ Failed to trigger lifecycle event for agent profile creation:', lifecycleError);
      }

      return profileId;
    } catch (error) {
      console.error('Failed to create agent profile:', error);
      throw error;
    }
  }

  async getAgentProfile(profileId: string): Promise<StoredAgentProfile | null> {
    if (!this.isStorageReady) return null;

    try {
      const profile = await storageExtension.get<StoredAgentProfile>('agents', `profile_${profileId}`);
      return profile && profile.userId === this.userId ? profile : null;
    } catch (error) {
      console.error('Failed to get agent profile:', error);
      return null;
    }
  }

  async getStoredAgentProfiles(): Promise<StoredAgentProfile[]> {
    if (!this.isStorageReady || !this.userId) return [];

    try {
      const keys = await unifiedStorage.keys('agents');
      const profileKeys = keys.filter(key => key.startsWith('profile_'));
      
      const profiles: StoredAgentProfile[] = [];
      
      for (const key of profileKeys) {
        const profile = await storageExtension.get<StoredAgentProfile>('agents', key);
        if (profile && profile.userId === this.userId) {
          profiles.push(profile);
        }
      }

      return profiles.sort((a, b) => b.lastModified - a.lastModified);
    } catch (error) {
      console.error('Failed to get stored agent profiles:', error);
      return [];
    }
  }

  // Multi-Agent Context Management
  async createMultiAgentContext(name: string, agentIds: string[], collaborationModel: string): Promise<string> {
    if (!this.isStorageReady || !this.userId) {
      throw new Error('Storage not ready or user not set');
    }

    try {
      // Create context using the existing multi-agent service
      const context = await this.multiAgentService.createContext({
        name,
        agent_ids: agentIds,
        collaboration_model: collaborationModel,
        governance_enabled: true
      });

      // Store enhanced context data in unified storage
      const storedContext: StoredMultiAgentContext = {
        ...context,
        userId: this.userId,
        persistentData: {
          sharedMemory: {},
          conversationHistory: [],
          collaborationMetrics: {}
        },
        lastActivity: Date.now()
      };

      await storageExtension.set('agents', `context_${context.context_id}`, storedContext);
      console.log('Multi-agent context created and stored:', context.context_id);

      // NEW: Trigger lifecycle event for multi-agent context creation
      try {
        // Convert multi-agent context to AgentProfile format for lifecycle tracking
        const agentProfile: any = {
          identity: {
            id: context.context_id,
            name: name || `Multi-Agent Context ${context.context_id}`,
            version: '1.0.0',
            description: `Multi-agent context with ${agentIds.length} agents using ${collaborationModel} collaboration model`,
            ownerId: this.userId,
            creationDate: new Date(),
            lastModifiedDate: new Date(),
            status: 'active'
          }
        };

        await useAgentCreatedHook(agentProfile);
        console.log('✅ Lifecycle event triggered for multi-agent context creation:', context.context_id);
      } catch (lifecycleError) {
        // Log but don't fail the creation process
        console.warn('⚠️ Failed to trigger lifecycle event for multi-agent context creation:', lifecycleError);
      }

      return context.context_id;
    } catch (error) {
      console.error('Failed to create multi-agent context:', error);
      throw error;
    }
  }

  async getMultiAgentContext(contextId: string): Promise<StoredMultiAgentContext | null> {
    if (!this.isStorageReady) return null;

    try {
      const context = await storageExtension.get<StoredMultiAgentContext>('agents', `context_${contextId}`);
      return context && context.userId === this.userId ? context : null;
    } catch (error) {
      console.error('Failed to get multi-agent context:', error);
      return null;
    }
  }

  async getStoredMultiAgentContexts(): Promise<StoredMultiAgentContext[]> {
    if (!this.isStorageReady || !this.userId) return [];

    try {
      const keys = await unifiedStorage.keys('agents');
      const contextKeys = keys.filter(key => key.startsWith('context_'));
      
      const contexts: StoredMultiAgentContext[] = [];
      
      for (const key of contextKeys) {
        const context = await storageExtension.get<StoredMultiAgentContext>('agents', key);
        if (context && context.userId === this.userId) {
          contexts.push(context);
        }
      }

      return contexts.sort((a, b) => b.lastActivity - a.lastActivity);
    } catch (error) {
      console.error('Failed to get stored multi-agent contexts:', error);
      return [];
    }
  }

  // Usage Tracking and Metrics
  async recordAgentUsage(wrapperId: string, success: boolean, responseTime: number): Promise<void> {
    if (!this.isStorageReady || !this.userId) return;

    try {
      const wrapper = await this.getAgentWrapper(wrapperId);
      if (!wrapper) return;

      wrapper.usageMetrics.totalRequests++;
      if (success) {
        wrapper.usageMetrics.successfulRequests++;
      } else {
        wrapper.usageMetrics.failedRequests++;
      }
      
      // Update average response time
      const totalSuccessful = wrapper.usageMetrics.successfulRequests;
      wrapper.usageMetrics.averageResponseTime = 
        ((wrapper.usageMetrics.averageResponseTime * (totalSuccessful - 1)) + responseTime) / totalSuccessful;
      
      wrapper.usageMetrics.lastUsed = Date.now();
      wrapper.lastModified = Date.now();

      await storageExtension.set('agents', `wrapper_${wrapperId}`, wrapper);
    } catch (error) {
      console.error('Failed to record agent usage:', error);
    }
  }

  async getAgentManagementMetrics(): Promise<AgentManagementMetrics> {
    if (!this.isStorageReady || !this.userId) {
      return {
        totalAgents: 0,
        activeWrappers: 0,
        multiAgentContexts: 0,
        totalRequests: 0,
        averageTrustScore: 0,
        complianceRate: 0
      };
    }

    try {
      const wrappers = await this.getStoredAgentWrappers();
      const profiles = await this.getStoredAgentProfiles();
      const contexts = await this.getStoredMultiAgentContexts();

      const activeWrappers = wrappers.filter(w => w.isActive && w.deploymentStatus === 'deployed');
      const totalRequests = wrappers.reduce((sum, w) => sum + w.usageMetrics.totalRequests, 0);
      const averageTrustScore = wrappers.length > 0 
        ? wrappers.reduce((sum, w) => sum + w.governanceData.trustScore, 0) / wrappers.length 
        : 0;
      const complianceRate = wrappers.length > 0
        ? wrappers.filter(w => w.governanceData.complianceScore >= 80).length / wrappers.length * 100
        : 0;

      return {
        totalAgents: profiles.length,
        activeWrappers: activeWrappers.length,
        multiAgentContexts: contexts.length,
        totalRequests,
        averageTrustScore,
        complianceRate
      };
    } catch (error) {
      console.error('Failed to get agent management metrics:', error);
      return {
        totalAgents: 0,
        activeWrappers: 0,
        multiAgentContexts: 0,
        totalRequests: 0,
        averageTrustScore: 0,
        complianceRate: 0
      };
    }
  }

  // Cleanup and Maintenance
  async cleanupOldData(olderThanDays: number = 90): Promise<number> {
    if (!this.isStorageReady || !this.userId) return 0;

    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      const keys = await unifiedStorage.keys('agents');
      
      let deletedCount = 0;

      for (const key of keys) {
        const data = await storageExtension.get<any>('agents', key);
        if (data && data.userId === this.userId) {
          // Delete archived wrappers older than cutoff
          if (key.startsWith('wrapper_') && 
              data.deploymentStatus === 'archived' && 
              data.lastModified < cutoffTime) {
            await storageExtension.delete('agents', key);
            deletedCount++;
          }
          
          // Delete inactive contexts older than cutoff
          if (key.startsWith('context_') && 
              data.lastActivity < cutoffTime) {
            await storageExtension.delete('agents', key);
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old agent management records`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old agent data:', error);
      return 0;
    }
  }

  // Delegate methods to original services
  async sendMultiAgentMessage(contextId: string, fromAgentId: string, toAgentIds: string[], message: any) {
    const result = await this.multiAgentService.sendMessage({
      context_id: contextId,
      from_agent_id: fromAgentId,
      to_agent_ids: toAgentIds,
      message
    });

    // Update stored context with new activity
    if (this.isStorageReady) {
      try {
        const context = await this.getMultiAgentContext(contextId);
        if (context) {
          context.lastActivity = Date.now();
          context.persistentData.conversationHistory.push({
            id: `msg_${Date.now()}`,
            from_agent_id: fromAgentId,
            content: message,
            timestamp: new Date().toISOString(),
            type: 'message'
          });

          // Keep only last 100 messages
          if (context.persistentData.conversationHistory.length > 100) {
            context.persistentData.conversationHistory = 
              context.persistentData.conversationHistory.slice(-100);
          }

          await storageExtension.set('agents', `context_${contextId}`, context);
        }
      } catch (error) {
        console.error('Failed to update context activity:', error);
      }
    }

    return result;
  }

  isStorageIntegrationReady(): boolean {
    return this.isStorageReady;
  }

  getCurrentUserId(): string {
    return this.userId;
  }
}

// Export singleton instance
export const agentManagementServiceUnified = new AgentManagementServiceUnified();

