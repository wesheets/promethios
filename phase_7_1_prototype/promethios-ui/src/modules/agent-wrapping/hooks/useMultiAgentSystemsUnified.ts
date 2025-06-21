/**
 * Enhanced Multi-Agent Systems Hook with Unified Storage Integration
 * 
 * React hook that integrates multi-agent coordination with the unified storage system
 * for persistent collaboration contexts and real-time synchronization.
 */

import { useState, useEffect, useCallback } from 'react';
import { agentManagementServiceUnified } from '../../../services/agentManagementServiceUnified';
import { MultiAgentContext, AgentMessage, CollaborationMetrics } from '../../../services/multiAgentService';
import { storageExtension } from '../../../extensions/StorageExtension';

// Enhanced types for the hook
interface StoredMultiAgentContext extends MultiAgentContext {
  userId: string;
  persistentData: {
    sharedMemory: Record<string, any>;
    conversationHistory: AgentMessage[];
    collaborationMetrics: any;
  };
  lastActivity: number;
}

interface UseMultiAgentSystemsReturn {
  // Data
  contexts: StoredMultiAgentContext[];
  activeContexts: StoredMultiAgentContext[];
  metrics: CollaborationMetrics | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error states
  error: string | null;
  
  // Actions
  createContext: (name: string, agentIds: string[], collaborationModel: string) => Promise<string>;
  updateContext: (contextId: string, updates: Partial<StoredMultiAgentContext>) => Promise<void>;
  deleteContext: (contextId: string) => Promise<void>;
  sendMessage: (contextId: string, fromAgentId: string, toAgentIds: string[], message: any) => Promise<any>;
  refreshContexts: () => Promise<void>;
  
  // Context management
  activateContext: (contextId: string) => Promise<void>;
  deactivateContext: (contextId: string) => Promise<void>;
  getContextHistory: (contextId: string) => AgentMessage[];
  updateSharedMemory: (contextId: string, key: string, value: any) => Promise<void>;
  
  // Utilities
  getContextById: (contextId: string) => StoredMultiAgentContext | undefined;
  getContextsByModel: (model: string) => StoredMultiAgentContext[];
  getContextsByAgent: (agentId: string) => StoredMultiAgentContext[];
  isStorageReady: boolean;
}

export const useMultiAgentSystemsUnified = (userId?: string): UseMultiAgentSystemsReturn => {
  // State
  const [contexts, setContexts] = useState<StoredMultiAgentContext[]>([]);
  const [metrics, setMetrics] = useState<CollaborationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Initialize service with user ID
  useEffect(() => {
    const initializeService = async () => {
      if (userId) {
        try {
          await agentManagementServiceUnified.setUserId(userId);
          setIsStorageReady(agentManagementServiceUnified.isStorageIntegrationReady());
          await refreshContexts();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to initialize multi-agent service');
        }
      }
    };

    initializeService();
  }, [userId]);

  // Refresh contexts from storage
  const refreshContexts = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const storedContexts = await agentManagementServiceUnified.getStoredMultiAgentContexts();
      setContexts(storedContexts);
      
      // Calculate collaboration metrics
      if (storedContexts.length > 0) {
        const totalMessages = storedContexts.reduce((sum, ctx) => 
          sum + ctx.persistentData.conversationHistory.length, 0);
        
        const activeAgents = new Set();
        storedContexts.forEach(ctx => {
          ctx.agent_ids.forEach(agentId => activeAgents.add(agentId));
        });

        setMetrics({
          context_id: 'aggregate',
          collaboration_model: 'mixed',
          total_messages: totalMessages,
          active_agents: activeAgents.size,
          average_participation: storedContexts.length > 0 
            ? totalMessages / storedContexts.length 
            : 0,
          agent_metrics: [],
          governance_metrics: {}
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load multi-agent contexts');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Create new context
  const createContext = useCallback(async (
    name: string, 
    agentIds: string[], 
    collaborationModel: string
  ): Promise<string> => {
    if (!userId) throw new Error('User ID required');

    try {
      setCreating(true);
      setError(null);
      
      const contextId = await agentManagementServiceUnified.createMultiAgentContext(
        name, 
        agentIds, 
        collaborationModel
      );
      
      await refreshContexts();
      return contextId;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create multi-agent context';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [userId, refreshContexts]);

  // Update context
  const updateContext = useCallback(async (
    contextId: string, 
    updates: Partial<StoredMultiAgentContext>
  ): Promise<void> => {
    if (!userId) throw new Error('User ID required');

    try {
      setUpdating(true);
      setError(null);
      
      const existingContext = await agentManagementServiceUnified.getMultiAgentContext(contextId);
      if (!existingContext) {
        throw new Error('Context not found');
      }

      const updatedContext = {
        ...existingContext,
        ...updates,
        lastActivity: Date.now()
      };

      await storageExtension.set('agents', `context_${contextId}`, updatedContext);
      await refreshContexts();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update multi-agent context';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [userId, refreshContexts]);

  // Delete context
  const deleteContext = useCallback(async (contextId: string): Promise<void> => {
    if (!userId) throw new Error('User ID required');

    try {
      setDeleting(true);
      setError(null);
      
      await storageExtension.delete('agents', `context_${contextId}`);
      await refreshContexts();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete multi-agent context';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDeleting(false);
    }
  }, [userId, refreshContexts]);

  // Send message
  const sendMessage = useCallback(async (
    contextId: string,
    fromAgentId: string,
    toAgentIds: string[],
    message: any
  ): Promise<any> => {
    if (!userId) throw new Error('User ID required');

    try {
      const result = await agentManagementServiceUnified.sendMultiAgentMessage(
        contextId,
        fromAgentId,
        toAgentIds,
        message
      );
      
      // Refresh contexts to show updated conversation history
      await refreshContexts();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [userId, refreshContexts]);

  // Activate context
  const activateContext = useCallback(async (contextId: string): Promise<void> => {
    await updateContext(contextId, { 
      status: 'active',
      lastActivity: Date.now()
    });
  }, [updateContext]);

  // Deactivate context
  const deactivateContext = useCallback(async (contextId: string): Promise<void> => {
    await updateContext(contextId, { 
      status: 'inactive'
    });
  }, [updateContext]);

  // Get context history
  const getContextHistory = useCallback((contextId: string): AgentMessage[] => {
    const context = contexts.find(ctx => ctx.context_id === contextId);
    return context?.persistentData.conversationHistory || [];
  }, [contexts]);

  // Update shared memory
  const updateSharedMemory = useCallback(async (
    contextId: string, 
    key: string, 
    value: any
  ): Promise<void> => {
    const context = await agentManagementServiceUnified.getMultiAgentContext(contextId);
    if (!context) {
      throw new Error('Context not found');
    }

    context.persistentData.sharedMemory[key] = value;
    context.lastActivity = Date.now();

    await storageExtension.set('agents', `context_${contextId}`, context);
    await refreshContexts();
  }, [refreshContexts]);

  // Utility functions
  const getContextById = useCallback((contextId: string): StoredMultiAgentContext | undefined => {
    return contexts.find(context => context.context_id === contextId);
  }, [contexts]);

  const getContextsByModel = useCallback((model: string): StoredMultiAgentContext[] => {
    return contexts.filter(context => context.collaboration_model === model);
  }, [contexts]);

  const getContextsByAgent = useCallback((agentId: string): StoredMultiAgentContext[] => {
    return contexts.filter(context => context.agent_ids.includes(agentId));
  }, [contexts]);

  // Computed values
  const activeContexts = contexts.filter(context => context.status === 'active');

  // Set up storage event listeners for real-time updates
  useEffect(() => {
    if (!isStorageReady) return;

    const handleStorageEvent = (event: any) => {
      if (event.namespace === 'agents' && event.key.startsWith('context_')) {
        // Refresh contexts when storage changes
        refreshContexts();
      }
    };

    const removeListener = storageExtension.addEventListener(handleStorageEvent);
    return removeListener;
  }, [isStorageReady, refreshContexts]);

  return {
    // Data
    contexts,
    activeContexts,
    metrics,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error states
    error,
    
    // Actions
    createContext,
    updateContext,
    deleteContext,
    sendMessage,
    refreshContexts,
    
    // Context management
    activateContext,
    deactivateContext,
    getContextHistory,
    updateSharedMemory,
    
    // Utilities
    getContextById,
    getContextsByModel,
    getContextsByAgent,
    isStorageReady
  };
};

// Backward compatibility - export the original hook name
export const useMultiAgentSystems = useMultiAgentSystemsUnified;

