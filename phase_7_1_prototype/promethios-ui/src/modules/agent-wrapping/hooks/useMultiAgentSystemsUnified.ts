/**
 * Enhanced Multi-Agent Systems Hook with Backend Integration
 * 
 * React hook that integrates multi-agent coordination with the real backend API
 * for persistent collaboration contexts and real-time synchronization.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMultiAgentBackend, MultiAgentContextData, MessageData } from '../../../hooks/useMultiAgentBackend';
import { CreateContextRequest, SendMessageRequest } from '../../../services/multiAgentBackendService';

// Enhanced types for the hook
interface StoredMultiAgentContext extends MultiAgentContextData {
  userId: string;
  lastActivity: number;
}

interface UseMultiAgentSystemsReturn {
  // Data
  contexts: StoredMultiAgentContext[];
  activeContexts: StoredMultiAgentContext[];
  messages: Map<string, MessageData[]>;
  
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
  getContextHistory: (contextId: string) => MessageData[];
  updateSharedMemory: (contextId: string, key: string, value: any) => Promise<void>;
  
  // Utilities
  getContextById: (contextId: string) => StoredMultiAgentContext | undefined;
  getContextsByModel: (model: string) => StoredMultiAgentContext[];
  getContextsByAgent: (agentId: string) => StoredMultiAgentContext[];
  isStorageReady: boolean;
}

export const useMultiAgentSystemsUnified = (userId?: string): UseMultiAgentSystemsReturn => {
  // Use the backend hook
  const {
    contexts: backendContexts,
    messages,
    loading: backendLoading,
    error: backendError,
    createContext: backendCreateContext,
    sendMessage: backendSendMessage,
    getConversationHistory,
    deleteContext: backendDeleteContext,
    refreshContexts: backendRefreshContexts
  } = useMultiAgentBackend(userId);

  // Additional state for UI compatibility
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeContextIds, setActiveContextIds] = useState<Set<string>>(new Set());

  // Transform backend contexts to include userId and lastActivity
  const contexts: StoredMultiAgentContext[] = backendContexts.map(ctx => ({
    ...ctx,
    userId: userId || 'unknown',
    lastActivity: new Date(ctx.lastActivity).getTime()
  }));

  // Filter active contexts
  const activeContexts = contexts.filter(ctx => activeContextIds.has(ctx.context_id));

  // Create context wrapper
  const createContext = useCallback(async (
    name: string, 
    agentIds: string[], 
    collaborationModel: string
  ): Promise<string> => {
    try {
      setCreating(true);
      
      const request: CreateContextRequest = {
        name,
        agent_ids: agentIds,
        collaboration_model: collaborationModel,
        governance_enabled: true,
        metadata: { userId: userId || 'unknown' }
      };
      
      const contextId = await backendCreateContext(request);
      return contextId;
      
    } catch (err) {
      throw err;
    } finally {
      setCreating(false);
    }
  }, [userId, backendCreateContext]);

  // Update context (placeholder - not implemented in backend yet)
  const updateContext = useCallback(async (
    contextId: string, 
    updates: Partial<StoredMultiAgentContext>
  ): Promise<void> => {
    try {
      setUpdating(true);
      // TODO: Implement context update in backend
      console.log('Context update not yet implemented in backend:', contextId, updates);
    } finally {
      setUpdating(false);
    }
  }, []);

  // Delete context wrapper
  const deleteContext = useCallback(async (contextId: string): Promise<void> => {
    try {
      setDeleting(true);
      await backendDeleteContext(contextId);
      
      // Remove from active contexts
      setActiveContextIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(contextId);
        return newSet;
      });
    } finally {
      setDeleting(false);
    }
  }, [backendDeleteContext]);

  // Send message wrapper
  const sendMessage = useCallback(async (
    contextId: string, 
    fromAgentId: string, 
    toAgentIds: string[], 
    message: any
  ): Promise<any> => {
    const request: SendMessageRequest = {
      context_id: contextId,
      from_agent_id: fromAgentId,
      to_agent_ids: toAgentIds,
      message,
      require_response: false,
      priority: 'normal'
    };
    
    return await backendSendMessage(request);
  }, [backendSendMessage]);

  // Activate context
  const activateContext = useCallback(async (contextId: string): Promise<void> => {
    setActiveContextIds(prev => new Set(prev).add(contextId));
    
    // Load conversation history for the context
    await getConversationHistory(contextId);
  }, [getConversationHistory]);

  // Deactivate context
  const deactivateContext = useCallback(async (contextId: string): Promise<void> => {
    setActiveContextIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(contextId);
      return newSet;
    });
  }, []);

  // Get context history
  const getContextHistory = useCallback((contextId: string): MessageData[] => {
    return messages.get(contextId) || [];
  }, [messages]);

  // Update shared memory (placeholder)
  const updateSharedMemory = useCallback(async (
    contextId: string, 
    key: string, 
    value: any
  ): Promise<void> => {
    // TODO: Implement shared memory update in backend
    console.log('Shared memory update not yet implemented:', contextId, key, value);
  }, []);

  // Utility functions
  const getContextById = useCallback((contextId: string): StoredMultiAgentContext | undefined => {
    return contexts.find(ctx => ctx.context_id === contextId);
  }, [contexts]);

  const getContextsByModel = useCallback((model: string): StoredMultiAgentContext[] => {
    return contexts.filter(ctx => ctx.collaboration_model === model);
  }, [contexts]);

  const getContextsByAgent = useCallback((agentId: string): StoredMultiAgentContext[] => {
    return contexts.filter(ctx => ctx.agent_ids.includes(agentId));
  }, [contexts]);

  return {
    // Data
    contexts,
    activeContexts,
    messages,
    
    // Loading states
    loading: backendLoading,
    creating,
    updating,
    deleting,
    
    // Error states
    error: backendError,
    
    // Actions
    createContext,
    updateContext,
    deleteContext,
    sendMessage,
    refreshContexts: backendRefreshContexts,
    
    // Context management
    activateContext,
    deactivateContext,
    getContextHistory,
    updateSharedMemory,
    
    // Utilities
    getContextById,
    getContextsByModel,
    getContextsByAgent,
    isStorageReady: true // Backend is always ready
  };
};

