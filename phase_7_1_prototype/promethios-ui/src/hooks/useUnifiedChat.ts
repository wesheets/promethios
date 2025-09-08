/**
 * useUnifiedChat Hook
 * 
 * React hook for integrating with the UnifiedChatManager system.
 * Provides a clean interface for components to use the new chat system.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import UnifiedChatManager, { ChatSession } from '../services/UnifiedChatManager';
import { Message, MessageTarget } from '../services/MessageRouter';
import { Participant } from '../services/ParticipantManager';
import { unifiedChatConfig, unifiedChatLogger, isUnifiedChatEnabled } from '../config/unifiedChatConfig';

interface UseUnifiedChatOptions {
  sessionId?: string;
  sessionName?: string;
  agentId?: string;
  initialParticipants?: string[];
  autoInitialize?: boolean;
}

interface UseUnifiedChatReturn {
  // State
  isEnabled: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Current session
  currentSession: ChatSession | null;
  messages: Message[];
  participants: Participant[];
  
  // Real-time status
  typingParticipants: string[];
  onlineParticipants: string[];
  
  // Manager access
  manager: UnifiedChatManager | null;
  
  // Actions
  initialize: (user: User) => Promise<void>;
  createOrGetSession: (sessionId: string, sessionName: string, agentId?: string, guestParticipants?: string[]) => Promise<ChatSession | null>;
  sendMessage: (content: string, target?: MessageTarget) => Promise<Message | null>;
  addParticipant: (userId: string, role?: string) => Promise<void>;
  removeParticipant: (userId: string) => Promise<void>;
  setTypingStatus: (isTyping: boolean) => Promise<void>;
  
  // Utilities
  cleanup: () => Promise<void>;
}

export const useUnifiedChat = (options: UseUnifiedChatOptions = {}): UseUnifiedChatReturn => {
  const {
    sessionId: initialSessionId,
    sessionName: initialSessionName,
    agentId: initialAgentId,
    initialParticipants = [],
    autoInitialize = true
  } = options;

  // Generate one stable, unique instance ID per component mount
  const instanceId = useRef(`hook_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`);
  
  // Simple persistent refs - the source of truth
  const isInitializedRef = useRef(false);
  const chatManagerRef = useRef<UnifiedChatManager | null>(null);
  const userRef = useRef<User | null>(null);
  
  // React state for triggering re-renders
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
  const [onlineParticipants, setOnlineParticipants] = useState<string[]>([]);

  // Simple logging for debugging
  useEffect(() => {
    unifiedChatLogger.info(`🆔 [useUnifiedChat] Hook instance created: ${instanceId.current}`);
    return () => {
      unifiedChatLogger.info(`🗑️ [useUnifiedChat] Hook instance destroyed: ${instanceId.current}`);
    };
  }, []);

  // Debug: Track state changes
  useEffect(() => {
    unifiedChatLogger.info(`🔍 [useUnifiedChat:${instanceId.current}] State changed:`, {
      isInitialized,
      hasManager: !!chatManagerRef.current,
      managerType: typeof chatManagerRef.current,
      isLoading,
      error
    });
  }, [isInitialized, isLoading, error]);

  // Refs for stable references
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Check if unified chat is enabled
  const isEnabled = isUnifiedChatEnabled();

  /**
   * Initialize the unified chat system
   */
  const initialize = useCallback(async (user: User) => {
    if (!isEnabled) {
      unifiedChatLogger.debug(`[${instanceId.current}] Unified chat disabled, skipping initialization`);
      return;
    }

    // Simple check: if already initialized, don't reinitialize
    if (isInitializedRef.current && chatManagerRef.current) {
      unifiedChatLogger.info(`[${instanceId.current}] Already initialized, reusing existing manager`);
      setIsInitialized(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info(`[${instanceId.current}] Initializing unified chat for user:`, user.uid);

      // Get UnifiedChatManager instance
      const manager = UnifiedChatManager.getInstance(unifiedChatConfig);
      await manager.initialize(user);

      unifiedChatLogger.info(`🔧 [useUnifiedChat:${instanceId.current}] Manager created successfully:`, manager);

      // Update refs and React state
      userRef.current = user;
      chatManagerRef.current = manager;
      isInitializedRef.current = true;
      setIsInitialized(true);

      unifiedChatLogger.info(`✅ [useUnifiedChat:${instanceId.current}] Initialization complete`);

      // Setup event listeners
      await setupEventListeners();

    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to initialize:`, error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Reset state on error
      isInitializedRef.current = false;
      chatManagerRef.current = null;
      userRef.current = null;
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  /**
   * Setup event listeners for real-time updates
   */
  const setupEventListeners = useCallback(async () => {
    if (!chatManagerRef.current) return;

    const manager = chatManagerRef.current;

    // Clear existing listeners
    eventListenersRef.current.clear();

    // Message events
    const onMessageReceived = (message: Message) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Message received:`, message);
      setMessages(prev => [...prev, message]);
    };

    const onMessageSent = (message: Message) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Message sent:`, message);
      setMessages(prev => [...prev, message]);
    };

    // Participant events
    const onParticipantJoined = (participant: Participant) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Participant joined:`, participant);
      setParticipants(prev => [...prev.filter(p => p.id !== participant.id), participant]);
    };

    const onParticipantLeft = (participantId: string) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Participant left:`, participantId);
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    };

    // Typing events
    const onTypingStarted = (participantId: string) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Typing started:`, participantId);
      setTypingParticipants(prev => [...prev.filter(id => id !== participantId), participantId]);
    };

    const onTypingStopped = (participantId: string) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Typing stopped:`, participantId);
      setTypingParticipants(prev => prev.filter(id => id !== participantId));
    };

    // Presence events
    const onParticipantOnline = (participantId: string) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Participant online:`, participantId);
      setOnlineParticipants(prev => [...prev.filter(id => id !== participantId), participantId]);
    };

    const onParticipantOffline = (participantId: string) => {
      unifiedChatLogger.debug(`[${instanceId.current}] Participant offline:`, participantId);
      setOnlineParticipants(prev => prev.filter(id => id !== participantId));
    };

    // Register event listeners
    manager.messageRouter.on('messageReceived', onMessageReceived);
    manager.messageRouter.on('messageSent', onMessageSent);
    manager.participantManager.on('participantJoined', onParticipantJoined);
    manager.participantManager.on('participantLeft', onParticipantLeft);
    manager.participantManager.on('typingStarted', onTypingStarted);
    manager.participantManager.on('typingStopped', onTypingStopped);
    manager.participantManager.on('participantOnline', onParticipantOnline);
    manager.participantManager.on('participantOffline', onParticipantOffline);

    // Store references for cleanup
    eventListenersRef.current.set('messageReceived', onMessageReceived);
    eventListenersRef.current.set('messageSent', onMessageSent);
    eventListenersRef.current.set('participantJoined', onParticipantJoined);
    eventListenersRef.current.set('participantLeft', onParticipantLeft);
    eventListenersRef.current.set('typingStarted', onTypingStarted);
    eventListenersRef.current.set('typingStopped', onTypingStopped);
    eventListenersRef.current.set('participantOnline', onParticipantOnline);
    eventListenersRef.current.set('participantOffline', onParticipantOffline);

    unifiedChatLogger.info(`[${instanceId.current}] Event listeners set up`);
  }, []);

  /**
   * Create or get a chat session
   */
  const createOrGetSession = useCallback(async (
    sessionId: string,
    sessionName: string,
    agentId?: string,
    guestParticipants?: string[]
  ): Promise<ChatSession | null> => {
    if (!chatManagerRef.current) {
      unifiedChatLogger.error(`[${instanceId.current}] Cannot create session - manager not initialized`);
      return null;
    }

    try {
      const session = await chatManagerRef.current.createOrGetSession(
        sessionId,
        sessionName,
        agentId,
        guestParticipants
      );
      
      setCurrentSession(session);
      unifiedChatLogger.info(`[${instanceId.current}] Session created/retrieved:`, session);
      
      return session;
    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to create/get session:`, error);
      setError(error instanceof Error ? error.message : 'Failed to create session');
      return null;
    }
  }, []);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (content: string, target?: MessageTarget): Promise<Message | null> => {
    if (!chatManagerRef.current) {
      unifiedChatLogger.error(`[${instanceId.current}] Cannot send message - manager not initialized`);
      return null;
    }

    try {
      const message = await chatManagerRef.current.sendMessage(content, target);
      unifiedChatLogger.debug(`[${instanceId.current}] Message sent:`, message);
      return message;
    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to send message:`, error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      return null;
    }
  }, []);

  /**
   * Add a participant
   */
  const addParticipant = useCallback(async (userId: string, role?: string): Promise<void> => {
    if (!chatManagerRef.current) {
      unifiedChatLogger.error(`[${instanceId.current}] Cannot add participant - manager not initialized`);
      return;
    }

    try {
      await chatManagerRef.current.addParticipant(userId, role);
      unifiedChatLogger.debug(`[${instanceId.current}] Participant added:`, userId);
    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to add participant:`, error);
      setError(error instanceof Error ? error.message : 'Failed to add participant');
    }
  }, []);

  /**
   * Remove a participant
   */
  const removeParticipant = useCallback(async (userId: string): Promise<void> => {
    if (!chatManagerRef.current) {
      unifiedChatLogger.error(`[${instanceId.current}] Cannot remove participant - manager not initialized`);
      return;
    }

    try {
      await chatManagerRef.current.removeParticipant(userId);
      unifiedChatLogger.debug(`[${instanceId.current}] Participant removed:`, userId);
    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to remove participant:`, error);
      setError(error instanceof Error ? error.message : 'Failed to remove participant');
    }
  }, []);

  /**
   * Set typing status
   */
  const setTypingStatus = useCallback(async (isTyping: boolean): Promise<void> => {
    if (!chatManagerRef.current) {
      unifiedChatLogger.error(`[${instanceId.current}] Cannot set typing status - manager not initialized`);
      return;
    }

    try {
      await chatManagerRef.current.setTypingStatus(isTyping);
      unifiedChatLogger.debug(`[${instanceId.current}] Typing status set:`, isTyping);
    } catch (error) {
      unifiedChatLogger.error(`[${instanceId.current}] Failed to set typing status:`, error);
      setError(error instanceof Error ? error.message : 'Failed to set typing status');
    }
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(async (): Promise<void> => {
    unifiedChatLogger.info(`[${instanceId.current}] Cleaning up unified chat hook`);

    // Remove event listeners
    if (chatManagerRef.current && eventListenersRef.current.size > 0) {
      const manager = chatManagerRef.current;
      
      eventListenersRef.current.forEach((listener, eventName) => {
        if (eventName.includes('message')) {
          manager.messageRouter.off(eventName, listener);
        } else {
          manager.participantManager.off(eventName, listener);
        }
      });
      
      eventListenersRef.current.clear();
    }

    // Reset all state
    isInitializedRef.current = false;
    chatManagerRef.current = null;
    userRef.current = null;
    setIsInitialized(false);
    setCurrentSession(null);
    setMessages([]);
    setParticipants([]);
    setTypingParticipants([]);
    setOnlineParticipants([]);
    setError(null);
    setIsLoading(false);

    unifiedChatLogger.info(`[${instanceId.current}] Cleanup complete`);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    isEnabled,
    isInitialized,
    hasManager: !!chatManagerRef.current,
    isLoading,
    error,
    
    // Current session
    currentSession,
    messages,
    participants,
    
    // Real-time status
    typingParticipants,
    onlineParticipants,
    
    // Manager access - return the actual manager from ref
    manager: chatManagerRef.current,
    
    // Actions
    initialize,
    createOrGetSession,
    sendMessage,
    addParticipant,
    removeParticipant,
    setTypingStatus,
    
    // Utilities
    cleanup
  };
};

export default useUnifiedChat;

