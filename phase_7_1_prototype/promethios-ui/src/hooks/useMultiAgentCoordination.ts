/**
 * Real-time Multi-Agent Coordination Hook
 * 
 * React hook for managing real-time multi-agent coordination,
 * shared context updates, and governance monitoring.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  multiAgentService,
  multiAgentObserver,
  multiAgentStatusTracker,
  MultiAgentContext,
  ConversationHistory,
  CollaborationMetrics,
  CreateContextRequest,
  SendMessageRequest
} from '../services/multiAgentService';

export interface UseMultiAgentCoordinationOptions {
  contextId?: string;
  autoStart?: boolean;
  pollingInterval?: number;
}

export interface MultiAgentState {
  context: MultiAgentContext | null;
  conversationHistory: ConversationHistory | null;
  metrics: CollaborationMetrics | null;
  agentStatuses: any[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

export interface MultiAgentActions {
  createContext: (request: CreateContextRequest) => Promise<MultiAgentContext>;
  sendMessage: (request: SendMessageRequest) => Promise<any>;
  refreshHistory: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  updateAgentStatus: (agentId: string, status: string) => void;
  terminateContext: () => Promise<void>;
  connect: (contextId: string) => void;
  disconnect: () => void;
}

/**
 * Multi-Agent Coordination Hook
 */
export function useMultiAgentCoordination(
  options: UseMultiAgentCoordinationOptions = {}
): [MultiAgentState, MultiAgentActions] {
  const { contextId: initialContextId, autoStart = true, pollingInterval = 2000 } = options;

  // State
  const [state, setState] = useState<MultiAgentState>({
    context: null,
    conversationHistory: null,
    metrics: null,
    agentStatuses: [],
    isLoading: false,
    error: null,
    isConnected: false,
  });

  // Refs for cleanup
  const observerUnsubscribe = useRef<(() => void) | null>(null);
  const statusUnsubscribe = useRef<(() => void) | null>(null);
  const currentContextId = useRef<string | null>(null);

  /**
   * Update state helper
   */
  const updateState = useCallback((updates: Partial<MultiAgentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle observer updates
   */
  const handleObserverUpdate = useCallback((update: any) => {
    if (update.type === 'update') {
      updateState({
        conversationHistory: update.history,
        metrics: update.metrics,
        error: null,
      });
    } else if (update.type === 'error') {
      updateState({
        error: update.error,
      });
    }
  }, [updateState]);

  /**
   * Handle status updates
   */
  const handleStatusUpdate = useCallback((status: any) => {
    updateState({
      agentStatuses: status.agents,
    });
  }, [updateState]);

  /**
   * Connect to a context
   */
  const connect = useCallback(async (contextId: string) => {
    if (currentContextId.current === contextId && state.isConnected) {
      return; // Already connected to this context
    }

    // Disconnect from previous context
    disconnect();

    updateState({ isLoading: true, error: null });

    try {
      // Subscribe to observer updates
      observerUnsubscribe.current = multiAgentObserver.subscribe(
        contextId,
        handleObserverUpdate
      );

      // Subscribe to status updates
      statusUnsubscribe.current = multiAgentStatusTracker.trackAgentStatus(
        contextId,
        handleStatusUpdate
      );

      // Load initial data
      const [history, metrics] = await Promise.all([
        multiAgentService.getConversationHistory(contextId),
        multiAgentService.getCollaborationMetrics(contextId),
      ]);

      currentContextId.current = contextId;
      updateState({
        conversationHistory: history,
        metrics,
        isConnected: true,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error connecting to multi-agent context:', error);
      updateState({
        error: error instanceof Error ? error.message : 'Connection failed',
        isLoading: false,
      });
    }
  }, [state.isConnected, handleObserverUpdate, handleStatusUpdate, updateState]);

  /**
   * Disconnect from current context
   */
  const disconnect = useCallback(() => {
    if (observerUnsubscribe.current) {
      observerUnsubscribe.current();
      observerUnsubscribe.current = null;
    }

    if (statusUnsubscribe.current) {
      statusUnsubscribe.current();
      statusUnsubscribe.current = null;
    }

    currentContextId.current = null;
    updateState({
      isConnected: false,
      conversationHistory: null,
      metrics: null,
      agentStatuses: [],
    });
  }, [updateState]);

  /**
   * Create a new context
   */
  const createContext = useCallback(async (request: CreateContextRequest): Promise<MultiAgentContext> => {
    updateState({ isLoading: true, error: null });

    try {
      const context = await multiAgentService.createContext(request);
      
      updateState({
        context,
        isLoading: false,
      });

      // Auto-connect if enabled
      if (autoStart) {
        await connect(context.context_id);
      }

      return context;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create context';
      updateState({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  }, [autoStart, connect, updateState]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<any> => {
    try {
      const result = await multiAgentService.sendMessage(request);
      
      // Update agent status to show activity
      multiAgentStatusTracker.updateAgentStatus(
        request.context_id,
        request.from_agent_id,
        'working'
      );

      return result;

    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to send message',
      });
      throw error;
    }
  }, [updateState]);

  /**
   * Refresh conversation history
   */
  const refreshHistory = useCallback(async () => {
    if (!currentContextId.current) return;

    try {
      const history = await multiAgentService.getConversationHistory(currentContextId.current);
      updateState({ conversationHistory: history });
    } catch (error) {
      console.error('Error refreshing history:', error);
    }
  }, [updateState]);

  /**
   * Refresh metrics
   */
  const refreshMetrics = useCallback(async () => {
    if (!currentContextId.current) return;

    try {
      const metrics = await multiAgentService.getCollaborationMetrics(currentContextId.current);
      updateState({ metrics });
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }, [updateState]);

  /**
   * Update agent status
   */
  const updateAgentStatus = useCallback((agentId: string, status: string) => {
    if (!currentContextId.current) return;

    multiAgentStatusTracker.updateAgentStatus(
      currentContextId.current,
      agentId,
      status
    );
  }, []);

  /**
   * Terminate context
   */
  const terminateContext = useCallback(async () => {
    if (!currentContextId.current) return;

    try {
      await multiAgentService.terminateContext(currentContextId.current);
      disconnect();
      updateState({ context: null });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to terminate context',
      });
      throw error;
    }
  }, [disconnect, updateState]);

  // Auto-connect on mount if contextId provided
  useEffect(() => {
    if (initialContextId && autoStart) {
      connect(initialContextId);
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [initialContextId, autoStart, connect, disconnect]);

  // Actions object
  const actions: MultiAgentActions = {
    createContext,
    sendMessage,
    refreshHistory,
    refreshMetrics,
    updateAgentStatus,
    terminateContext,
    connect,
    disconnect,
  };

  return [state, actions];
}

/**
 * Simplified hook for agent status tracking only
 */
export function useAgentStatus(contextId: string) {
  const [agentStatuses, setAgentStatuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contextId) return;

    const unsubscribe = multiAgentStatusTracker.trackAgentStatus(
      contextId,
      (status: any) => {
        setAgentStatuses(status.agents);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [contextId]);

  return { agentStatuses, isLoading };
}

/**
 * Hook for conversation history with real-time updates
 */
export function useConversationHistory(contextId: string, options: { limit?: number } = {}) {
  const [history, setHistory] = useState<ConversationHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contextId) return;

    const unsubscribe = multiAgentObserver.subscribe(
      contextId,
      (update: any) => {
        if (update.type === 'update' && update.history) {
          setHistory(update.history);
          setIsLoading(false);
        }
      }
    );

    // Load initial history
    multiAgentService.getConversationHistory(contextId, options)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setIsLoading(false));

    return unsubscribe;
  }, [contextId, options.limit]);

  return { history, isLoading };
}

