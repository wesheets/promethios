/**
 * React Hook for Chat Backend Integration
 * 
 * This hook provides React components with access to the revolutionary
 * AI Think Tank backend capabilities, including multi-system collaboration
 * and governed AI interactions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import chatBackendService, {
  ChatSession,
  ChatMessage,
  MessageResponse,
  GovernanceStatus,
  ChatSystemHealth,
  MessageRequest
} from '../services/chatBackendService';

export interface UseChatBackendOptions {
  userId: string;
  sessionId?: string;
  autoLoadHistory?: boolean;
  governanceEnabled?: boolean;
}

export interface ChatState {
  // Session Management
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  
  // Messages
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  
  // Governance
  governanceStatus: GovernanceStatus | null;
  systemHealth: ChatSystemHealth | null;
  
  // Error Handling
  error: string | null;
  lastResponse: MessageResponse | null;
}

export interface ChatActions {
  // Session Management
  createSession: (
    sessionType?: 'single_agent' | 'multi_agent',
    options?: any
  ) => Promise<ChatSession>;
  createThinkTankSession: (options?: any) => Promise<ChatSession>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  listSessions: () => Promise<void>;
  
  // Messaging
  sendMessage: (content: string, options?: Partial<MessageRequest>) => Promise<MessageResponse>;
  sendThinkTankMessage: (
    message: string,
    options?: {
      priority?: 'low' | 'medium' | 'high';
      analysisType?: 'research' | 'policy' | 'strategic' | 'creative';
    }
  ) => Promise<MessageResponse>;
  loadMessages: (limit?: number, offset?: number) => Promise<void>;
  
  // Governance
  refreshGovernanceStatus: () => Promise<void>;
  checkSystemHealth: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  resetChat: () => void;
}

export function useChatBackend(options: UseChatBackendOptions): [ChatState, ChatActions] {
  const { userId, sessionId, autoLoadHistory = true, governanceEnabled = true } = options;
  
  // State
  const [state, setState] = useState<ChatState>({
    currentSession: null,
    sessions: [],
    messages: [],
    isLoading: false,
    isSending: false,
    governanceStatus: null,
    systemHealth: null,
    error: null,
    lastResponse: null,
  });
  
  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Helper to update state
  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);
  
  // Error handler
  const handleError = useCallback((error: any) => {
    console.error('Chat backend error:', error);
    updateState({
      error: error.message || 'An unexpected error occurred',
      isLoading: false,
      isSending: false,
    });
  }, [updateState]);
  
  // Session Management Actions
  const createSession = useCallback(async (
    sessionType: 'single_agent' | 'multi_agent' = 'single_agent',
    sessionOptions: any = {}
  ): Promise<ChatSession> => {
    try {
      updateState({ isLoading: true, error: null });
      
      const session = await chatBackendService.createSession(userId, sessionType, {
        governanceEnabled,
        ...sessionOptions,
      });
      
      updateState({
        currentSession: session,
        messages: [],
        isLoading: false,
      });
      
      return session;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [userId, governanceEnabled, updateState, handleError]);
  
  const createThinkTankSession = useCallback(async (thinkTankOptions: any = {}): Promise<ChatSession> => {
    try {
      updateState({ isLoading: true, error: null });
      
      const session = await chatBackendService.createThinkTankSession(userId, {
        coordinationPattern: 'collaborative',
        aiSystems: ['factual-agent', 'creative-agent', 'governance-agent'],
        consensusThreshold: 0.8,
        maxRounds: 3,
        governanceLevel: 'moderate',
        ...thinkTankOptions,
      });
      
      updateState({
        currentSession: session,
        messages: [],
        isLoading: false,
      });
      
      return session;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [userId, updateState, handleError]);
  
  const loadSession = useCallback(async (targetSessionId: string): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null });
      
      const session = await chatBackendService.getSession(targetSessionId);
      updateState({ currentSession: session });
      
      if (autoLoadHistory) {
        const history = await chatBackendService.getConversationHistory(targetSessionId);
        updateState({ messages: history.messages });
      }
      
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error);
    }
  }, [autoLoadHistory, updateState, handleError]);
  
  const deleteSession = useCallback(async (targetSessionId: string): Promise<void> => {
    try {
      updateState({ isLoading: true, error: null });
      
      await chatBackendService.deleteSession(targetSessionId);
      
      // If deleting current session, clear it
      if (state.currentSession?.session_id === targetSessionId) {
        updateState({
          currentSession: null,
          messages: [],
        });
      }
      
      // Refresh sessions list
      await listSessions();
      
      updateState({ isLoading: false });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentSession, updateState, handleError]);
  
  const listSessions = useCallback(async (): Promise<void> => {
    try {
      const result = await chatBackendService.listSessions({ userId });
      updateState({ sessions: result.sessions });
    } catch (error) {
      handleError(error);
    }
  }, [userId, updateState, handleError]);
  
  // Messaging Actions
  const sendMessage = useCallback(async (
    content: string,
    messageOptions: Partial<MessageRequest> = {}
  ): Promise<MessageResponse> => {
    if (!state.currentSession) {
      throw new Error('No active chat session');
    }
    
    try {
      updateState({ isSending: true, error: null });
      
      // Add user message to UI immediately
      const userMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        session_id: state.currentSession.session_id,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };
      
      updateState({
        messages: [...state.messages, userMessage],
      });
      
      // Send message to backend
      const response = await chatBackendService.sendMessage(
        state.currentSession.session_id,
        { content, ...messageOptions }
      );
      
      // Add assistant response to UI
      const assistantMessage: ChatMessage = {
        message_id: response.message_id,
        session_id: response.session_id,
        role: 'assistant',
        content: response.response_content,
        timestamp: new Date().toISOString(),
        governance_metadata: {
          governance_status: response.governance_status,
          trust_score: response.trust_score,
          policy_compliance: response.policy_compliance,
          observer_notes: response.observer_notes,
          processing_time_ms: response.processing_time_ms,
          coordination_details: response.coordination_details,
        },
      };
      
      updateState({
        messages: [...state.messages.filter(m => m.message_id !== userMessage.message_id), userMessage, assistantMessage],
        lastResponse: response,
        isSending: false,
      });
      
      return response;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.currentSession, state.messages, updateState, handleError]);
  
  const sendThinkTankMessage = useCallback(async (
    message: string,
    thinkTankOptions: {
      priority?: 'low' | 'medium' | 'high';
      analysisType?: 'research' | 'policy' | 'strategic' | 'creative';
    } = {}
  ): Promise<MessageResponse> => {
    if (!state.currentSession) {
      throw new Error('No active chat session');
    }
    
    try {
      updateState({ isSending: true, error: null });
      
      // Add user message with think tank indicator
      const userMessage: ChatMessage = {
        message_id: `temp-${Date.now()}`,
        session_id: state.currentSession.session_id,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        governance_metadata: {
          think_tank_mode: true,
          analysis_type: thinkTankOptions.analysisType || 'research',
          priority: thinkTankOptions.priority || 'medium',
        },
      };
      
      updateState({
        messages: [...state.messages, userMessage],
      });
      
      // Send to AI Think Tank
      const response = await chatBackendService.sendThinkTankMessage(
        state.currentSession.session_id,
        message,
        thinkTankOptions
      );
      
      // Add think tank response with coordination details
      const assistantMessage: ChatMessage = {
        message_id: response.message_id,
        session_id: response.session_id,
        role: 'assistant',
        content: response.response_content,
        timestamp: new Date().toISOString(),
        governance_metadata: {
          governance_status: response.governance_status,
          trust_score: response.trust_score,
          policy_compliance: response.policy_compliance,
          observer_notes: response.observer_notes,
          processing_time_ms: response.processing_time_ms,
          coordination_details: response.coordination_details,
          think_tank_response: true,
        },
      };
      
      updateState({
        messages: [...state.messages.filter(m => m.message_id !== userMessage.message_id), userMessage, assistantMessage],
        lastResponse: response,
        isSending: false,
      });
      
      return response;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [state.currentSession, state.messages, updateState, handleError]);
  
  const loadMessages = useCallback(async (limit: number = 50, offset: number = 0): Promise<void> => {
    if (!state.currentSession) return;
    
    try {
      updateState({ isLoading: true, error: null });
      
      const history = await chatBackendService.getConversationHistory(
        state.currentSession.session_id,
        { limit, offset }
      );
      
      updateState({
        messages: offset === 0 ? history.messages : [...state.messages, ...history.messages],
        isLoading: false,
      });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentSession, state.messages, updateState, handleError]);
  
  // Governance Actions
  const refreshGovernanceStatus = useCallback(async (): Promise<void> => {
    if (!state.currentSession) return;
    
    try {
      const governanceStatus = await chatBackendService.getGovernanceStatus(
        state.currentSession.session_id
      );
      updateState({ governanceStatus });
    } catch (error) {
      handleError(error);
    }
  }, [state.currentSession, updateState, handleError]);
  
  const checkSystemHealth = useCallback(async (): Promise<void> => {
    try {
      const systemHealth = await chatBackendService.getSystemHealth();
      updateState({ systemHealth });
    } catch (error) {
      handleError(error);
    }
  }, [updateState, handleError]);
  
  // Utility Actions
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);
  
  const resetChat = useCallback(() => {
    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    updateState({
      currentSession: null,
      messages: [],
      isLoading: false,
      isSending: false,
      governanceStatus: null,
      error: null,
      lastResponse: null,
    });
  }, [updateState]);
  
  // Effects
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);
  
  useEffect(() => {
    // Load user sessions on mount
    listSessions();
    
    // Check system health on mount
    checkSystemHealth();
  }, [listSessions, checkSystemHealth]);
  
  useEffect(() => {
    // Refresh governance status when session changes
    if (state.currentSession) {
      refreshGovernanceStatus();
    }
  }, [state.currentSession, refreshGovernanceStatus]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Return state and actions
  const actions: ChatActions = {
    createSession,
    createThinkTankSession,
    loadSession,
    deleteSession,
    listSessions,
    sendMessage,
    sendThinkTankMessage,
    loadMessages,
    refreshGovernanceStatus,
    checkSystemHealth,
    clearError,
    resetChat,
  };
  
  return [state, actions];
}

export default useChatBackend;

