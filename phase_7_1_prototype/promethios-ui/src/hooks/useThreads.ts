/**
 * useThreads - Custom hook for managing threaded conversations
 * Provides state management and operations for threads
 */

import { useState, useEffect, useCallback } from 'react';
import { Thread, ThreadSubscription, CreateThreadRequest, AddThreadReplyRequest } from '../types/Thread';
import ThreadService from '../services/ThreadService';

interface UseThreadsOptions {
  conversationId?: string;
  autoSubscribe?: boolean;
}

interface UseThreadsReturn {
  // State
  threads: Thread[];
  activeThread: ThreadSubscription | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  createThread: (request: CreateThreadRequest) => Promise<string>;
  openThread: (threadId: string) => void;
  closeThread: () => void;
  addReply: (request: AddThreadReplyRequest) => Promise<string>;
  refreshThreads: () => Promise<void>;
  
  // Utils
  getThreadById: (threadId: string) => Thread | undefined;
  hasThread: (messageId: string) => boolean;
}

export const useThreads = (options: UseThreadsOptions = {}): UseThreadsReturn => {
  const { conversationId, autoSubscribe = true } = options;
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<ThreadSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Load threads for conversation
  const loadThreads = useCallback(async () => {
    if (!conversationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const conversationThreads = await ThreadService.getConversationThreads(conversationId);
      setThreads(conversationThreads);
      console.log('✅ [useThreads] Loaded threads:', conversationThreads.length);
    } catch (err) {
      console.error('❌ [useThreads] Error loading threads:', err);
      setError('Failed to load threads');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Load threads on mount and when conversationId changes
  useEffect(() => {
    if (conversationId && autoSubscribe) {
      loadThreads();
    }
  }, [conversationId, autoSubscribe, loadThreads]);

  // Subscribe to active thread
  useEffect(() => {
    if (!activeThreadId) {
      setActiveThread(null);
      return;
    }

    console.log('🔔 [useThreads] Subscribing to active thread:', activeThreadId);
    
    const unsubscribe = ThreadService.subscribeToThread(activeThreadId, (data) => {
      console.log('📨 [useThreads] Active thread update:', data);
      setActiveThread(data);
    });

    return () => {
      console.log('🔕 [useThreads] Unsubscribing from active thread');
      unsubscribe();
    };
  }, [activeThreadId]);

  // Create a new thread
  const createThread = useCallback(async (request: CreateThreadRequest): Promise<string> => {
    console.log('🧵 [useThreads] Creating thread:', request);
    setError(null);
    
    try {
      const threadId = await ThreadService.createThread(request);
      
      // Refresh threads list
      if (conversationId === request.conversationId) {
        await loadThreads();
      }
      
      console.log('✅ [useThreads] Thread created:', threadId);
      return threadId;
    } catch (err) {
      console.error('❌ [useThreads] Error creating thread:', err);
      setError('Failed to create thread');
      throw err;
    }
  }, [conversationId, loadThreads]);

  // Open a thread
  const openThread = useCallback((threadId: string) => {
    console.log('📖 [useThreads] Opening thread:', threadId);
    setActiveThreadId(threadId);
  }, []);

  // Close active thread
  const closeThread = useCallback(() => {
    console.log('❌ [useThreads] Closing active thread');
    setActiveThreadId(null);
    setActiveThread(null);
  }, []);

  // Add reply to thread
  const addReply = useCallback(async (request: AddThreadReplyRequest): Promise<string> => {
    console.log('💬 [useThreads] Adding reply:', request);
    setError(null);
    
    try {
      const replyId = await ThreadService.addReply(request);
      
      // Update threads list if this thread is in our current conversation
      const thread = threads.find(t => t.id === request.threadId);
      if (thread && conversationId === thread.conversationId) {
        await loadThreads();
      }
      
      console.log('✅ [useThreads] Reply added:', replyId);
      return replyId;
    } catch (err) {
      console.error('❌ [useThreads] Error adding reply:', err);
      setError('Failed to add reply');
      throw err;
    }
  }, [threads, conversationId, loadThreads]);

  // Refresh threads
  const refreshThreads = useCallback(async () => {
    console.log('🔄 [useThreads] Refreshing threads');
    await loadThreads();
  }, [loadThreads]);

  // Get thread by ID
  const getThreadById = useCallback((threadId: string): Thread | undefined => {
    return threads.find(thread => thread.id === threadId);
  }, [threads]);

  // Check if message has thread
  const hasThread = useCallback((messageId: string): boolean => {
    return threads.some(thread => thread.parentMessageId === messageId);
  }, [threads]);

  return {
    // State
    threads,
    activeThread,
    loading,
    error,
    
    // Actions
    createThread,
    openThread,
    closeThread,
    addReply,
    refreshThreads,
    
    // Utils
    getThreadById,
    hasThread
  };
};

export default useThreads;

