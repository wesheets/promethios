/**
 * useMultiAgentBackend Hook
 * 
 * React hook for managing multi-agent system data with the real backend API.
 * Provides context management, messaging, and collaboration metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  multiAgentBackendService, 
  CreateContextRequest, 
  SendMessageRequest,
  BackendMultiAgentContext,
  BackendAgentMessage,
  BackendCollaborationMetrics
} from '../services/multiAgentBackendService';

export interface MultiAgentContextData {
  context_id: string;
  name: string;
  agent_ids: string[];
  collaboration_model: string;
  status: string;
  created_at: string;
  lastActivity: string;
  policies: Record<string, any>;
  governance_enabled: boolean;
  metadata: Record<string, any>;
  persistentData: {
    conversationHistory: any[];
    sharedContext: Record<string, any>;
    collaborationRules: Record<string, any>;
  };
}

export interface MessageData {
  id: string;
  from_agent_id: string;
  to_agent_ids: string[];
  content: Record<string, any>;
  timestamp: string;
  type: string;
  governance_data: Record<string, any>;
  context_id: string;
}

export interface CollaborationMetricsData {
  context_id: string;
  collaboration_model: string;
  totalMessages: number;
  activeAgents: number;
  averageParticipation: number;
  agentMetrics: Array<{
    agent_id: string;
    messageCount: number;
    participationRate: number;
    responsiveness: number;
    isActive: boolean;
  }>;
  governanceMetrics: {
    complianceScore: number;
    trustLevel: string;
    violations: number;
  };
}

export interface UseMultiAgentBackendReturn {
  // Data
  contexts: MultiAgentContextData[];
  messages: Map<string, MessageData[]>;
  metrics: Map<string, CollaborationMetricsData>;
  
  // Loading states
  loading: boolean;
  loadingMessages: boolean;
  loadingMetrics: boolean;
  
  // Error states
  error: string | null;
  
  // Operations
  createContext: (request: CreateContextRequest) => Promise<string>;
  sendMessage: (request: SendMessageRequest) => Promise<string>;
  getConversationHistory: (contextId: string, options?: any) => Promise<MessageData[]>;
  getCollaborationMetrics: (contextId: string) => Promise<CollaborationMetricsData>;
  deleteContext: (contextId: string) => Promise<void>;
  refreshContexts: () => Promise<void>;
  checkBackendHealth: () => Promise<boolean>;
}

export const useMultiAgentBackend = (ownerId?: string): UseMultiAgentBackendReturn => {
  // State
  const [contexts, setContexts] = useState<MultiAgentContextData[]>([]);
  const [messages, setMessages] = useState<Map<string, MessageData[]>>(new Map());
  const [metrics, setMetrics] = useState<Map<string, CollaborationMetricsData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load contexts from backend
  const loadContexts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const backendContexts = await multiAgentBackendService.listContexts({ ownerId });
      const transformedContexts = (backendContexts || []).map(context => 
        multiAgentBackendService.transformContext(context)
      );
      
      setContexts(transformedContexts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load contexts';
      setError(errorMessage);
      console.error('Error loading contexts:', err);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // Create a new context
  const createContext = useCallback(async (request: CreateContextRequest): Promise<string> => {
    try {
      setError(null);
      const response = await multiAgentBackendService.createContext(request);
      
      // Refresh contexts list after creation
      await loadContexts();
      
      return response.context_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create context';
      setError(errorMessage);
      throw err;
    }
  }, [loadContexts]);

  // Send a message
  const sendMessage = useCallback(async (request: SendMessageRequest): Promise<string> => {
    try {
      setError(null);
      const response = await multiAgentBackendService.sendMessage(request);
      
      // Refresh conversation history for the context
      await getConversationHistory(request.context_id);
      
      return response.message_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Get conversation history
  const getConversationHistory = useCallback(async (
    contextId: string, 
    options: any = {}
  ): Promise<MessageData[]> => {
    try {
      setLoadingMessages(true);
      setError(null);
      
      const history = await multiAgentBackendService.getConversationHistory(contextId, options);
      const transformedMessages = (history?.messages || []).map(message => 
        multiAgentBackendService.transformMessage(message)
      );
      
      // Cache the messages
      setMessages(prev => new Map(prev).set(contextId, transformedMessages));
      
      return transformedMessages;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get conversation history';
      setError(errorMessage);
      console.error('Error getting conversation history:', err);
      return [];
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Get collaboration metrics
  const getCollaborationMetrics = useCallback(async (contextId: string): Promise<CollaborationMetricsData> => {
    try {
      setLoadingMetrics(true);
      setError(null);
      
      const backendMetrics = await multiAgentBackendService.getCollaborationMetrics(contextId);
      const transformedMetrics = multiAgentBackendService.transformMetrics(backendMetrics);
      
      // Cache the metrics
      setMetrics(prev => new Map(prev).set(contextId, transformedMetrics));
      
      return transformedMetrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get collaboration metrics';
      setError(errorMessage);
      console.error('Error getting collaboration metrics:', err);
      throw err;
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Delete a context
  const deleteContext = useCallback(async (contextId: string): Promise<void> => {
    try {
      setError(null);
      await multiAgentBackendService.deleteContext(contextId);
      
      // Remove from local state
      setContexts(prev => prev.filter(ctx => ctx.context_id !== contextId));
      setMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(contextId);
        return newMap;
      });
      setMetrics(prev => {
        const newMap = new Map(prev);
        newMap.delete(contextId);
        return newMap;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete context';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refresh contexts list
  const refreshContexts = useCallback(async (): Promise<void> => {
    await loadContexts();
  }, [loadContexts]);

  // Check backend health
  const checkBackendHealth = useCallback(async (): Promise<boolean> => {
    try {
      await multiAgentBackendService.checkHealth();
      return true;
    } catch (err) {
      console.error('Backend health check failed:', err);
      return false;
    }
  }, []);

  // Load contexts on mount
  useEffect(() => {
    loadContexts();
  }, [loadContexts]);

  return {
    // Data
    contexts,
    messages,
    metrics,
    
    // Loading states
    loading,
    loadingMessages,
    loadingMetrics,
    
    // Error states
    error,
    
    // Operations
    createContext,
    sendMessage,
    getConversationHistory,
    getCollaborationMetrics,
    deleteContext,
    refreshContexts,
    checkBackendHealth,
  };
};

