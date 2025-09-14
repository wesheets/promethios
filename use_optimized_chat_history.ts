/**
 * useOptimizedChatHistory - React Hook for Optimized Chat Loading
 * 
 * Features:
 * 1. Automatic caching with TTL
 * 2. Skeleton loading states
 * 3. Background refresh
 * 4. Optimistic updates
 * 5. Error handling and retry logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, ChatHistoryFilter } from '../services/ChatHistoryService';
import { chatHistoryService } from './chat_history_service_optimized';

interface UseOptimizedChatHistoryOptions {
  userId: string;
  agentId?: string;
  searchTerm?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

interface UseOptimizedChatHistoryReturn {
  // Data
  sessions: ChatSession[];
  filteredSessions: ChatSession[];
  
  // Loading states
  isInitialLoading: boolean;
  isBackgroundRefreshing: boolean;
  isError: boolean;
  error: Error | null;
  
  // Actions
  refresh: (force?: boolean) => Promise<void>;
  createSession: (agentId: string, agentName: string, name?: string) => Promise<ChatSession>;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Cache info
  cacheStats: any;
  lastRefresh: Date | null;
}

export const useOptimizedChatHistory = (
  options: UseOptimizedChatHistoryOptions
): UseOptimizedChatHistoryReturn => {
  const {
    userId,
    agentId,
    searchTerm = '',
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealtime = false
  } = options;

  // State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Refs
  const isMountedRef = useRef(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeUnsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
      }
    };
  }, []);

  // Create filter object
  const filter: ChatHistoryFilter = {
    ...(agentId && { agentId }),
    ...(searchTerm && { searchTerm })
  };

  // Load sessions function
  const loadSessions = useCallback(async (forceRefresh = false) => {
    if (!userId) return;

    try {
      if (!forceRefresh) {
        setIsInitialLoading(true);
      } else {
        setIsBackgroundRefreshing(true);
      }
      
      setIsError(false);
      setError(null);

      console.log('🔄 [useOptimizedChatHistory] Loading sessions...', { userId, filter, forceRefresh });
      
      const loadedSessions = await chatHistoryService.getChatSessions(userId, filter);
      
      if (isMountedRef.current) {
        setSessions(loadedSessions);
        setLastRefresh(new Date());
        console.log('✅ [useOptimizedChatHistory] Sessions loaded:', loadedSessions.length);
      }
    } catch (err) {
      console.error('❌ [useOptimizedChatHistory] Error loading sessions:', err);
      if (isMountedRef.current) {
        setIsError(true);
        setError(err as Error);
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitialLoading(false);
        setIsBackgroundRefreshing(false);
      }
    }
  }, [userId, agentId, searchTerm]);

  // Setup realtime listener
  useEffect(() => {
    if (!enableRealtime || !userId) return;

    console.log('🔄 [useOptimizedChatHistory] Setting up realtime listener...');
    
    const unsubscribe = chatHistoryService.setupRealtimeListener(userId, (realtimeSessions) => {
      if (isMountedRef.current) {
        console.log('🔄 [useOptimizedChatHistory] Realtime update received:', realtimeSessions.length);
        
        // Apply filters to realtime data
        let filteredRealtime = realtimeSessions;
        if (agentId) {
          filteredRealtime = filteredRealtime.filter(s => s.agentId === agentId);
        }
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredRealtime = filteredRealtime.filter(s => 
            s.name.toLowerCase().includes(term) ||
            s.lastMessage?.toLowerCase().includes(term)
          );
        }
        
        setSessions(filteredRealtime);
        setLastRefresh(new Date());
      }
    });

    realtimeUnsubscribeRef.current = unsubscribe;

    return () => {
      if (realtimeUnsubscribeRef.current) {
        realtimeUnsubscribeRef.current();
        realtimeUnsubscribeRef.current = null;
      }
    };
  }, [userId, agentId, searchTerm, enableRealtime]);

  // Initial load
  useEffect(() => {
    if (!enableRealtime) {
      loadSessions();
    }
  }, [loadSessions, enableRealtime]);

  // Auto refresh setup
  useEffect(() => {
    if (!autoRefresh || enableRealtime) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          loadSessions(true);
          scheduleRefresh();
        }
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadSessions, enableRealtime]);

  // Refresh function
  const refresh = useCallback(async (force = false) => {
    await loadSessions(force);
  }, [loadSessions]);

  // Create session with optimistic update
  const createSession = useCallback(async (
    sessionAgentId: string, 
    agentName: string, 
    name?: string
  ): Promise<ChatSession> => {
    try {
      console.log('🆕 [useOptimizedChatHistory] Creating session...', { sessionAgentId, agentName, name });
      
      const newSession = await chatHistoryService.createChatSession(
        sessionAgentId,
        agentName,
        userId,
        name
      );

      // Optimistic update
      if (isMountedRef.current) {
        setSessions(prev => [newSession, ...prev]);
        setLastRefresh(new Date());
      }

      console.log('✅ [useOptimizedChatHistory] Session created:', newSession.id);
      return newSession;
    } catch (err) {
      console.error('❌ [useOptimizedChatHistory] Error creating session:', err);
      throw err;
    }
  }, [userId]);

  // Update session with optimistic update
  const updateSession = useCallback(async (
    sessionId: string, 
    updates: Partial<ChatSession>
  ): Promise<void> => {
    try {
      console.log('🔄 [useOptimizedChatHistory] Updating session...', { sessionId, updates });
      
      // Optimistic update
      if (isMountedRef.current) {
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, ...updates, updatedAt: new Date() }
            : session
        ));
      }

      await chatHistoryService.updateChatSession(sessionId, updates);
      
      if (isMountedRef.current) {
        setLastRefresh(new Date());
      }

      console.log('✅ [useOptimizedChatHistory] Session updated:', sessionId);
    } catch (err) {
      console.error('❌ [useOptimizedChatHistory] Error updating session:', err);
      // Revert optimistic update on error
      await refresh(true);
      throw err;
    }
  }, [refresh]);

  // Delete session with optimistic update
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      console.log('🗑️ [useOptimizedChatHistory] Deleting session...', sessionId);
      
      // Optimistic update
      const sessionToDelete = sessions.find(s => s.id === sessionId);
      if (isMountedRef.current) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
      }

      await chatHistoryService.deleteChatSession(sessionId);
      
      if (isMountedRef.current) {
        setLastRefresh(new Date());
      }

      console.log('✅ [useOptimizedChatHistory] Session deleted:', sessionId);
    } catch (err) {
      console.error('❌ [useOptimizedChatHistory] Error deleting session:', err);
      // Revert optimistic update on error
      await refresh(true);
      throw err;
    }
  }, [sessions, refresh]);

  // Filtered sessions based on current search term
  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      session.name.toLowerCase().includes(term) ||
      session.lastMessage?.toLowerCase().includes(term)
    );
  });

  // Get cache stats
  const cacheStats = chatHistoryService.getCacheStats();

  return {
    // Data
    sessions,
    filteredSessions,
    
    // Loading states
    isInitialLoading,
    isBackgroundRefreshing,
    isError,
    error,
    
    // Actions
    refresh,
    createSession,
    updateSession,
    deleteSession,
    
    // Cache info
    cacheStats,
    lastRefresh
  };
};

export default useOptimizedChatHistory;

