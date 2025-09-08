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

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
  const [onlineParticipants, setOnlineParticipants] = useState<string[]>([]);
  const [chatManager, setChatManager] = useState<UnifiedChatManager | null>(null);

  // Refs for stable references
  const userRef = useRef<User | null>(null);
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Check if unified chat is enabled
  const isEnabled = isUnifiedChatEnabled();

  /**
   * Initialize the unified chat system
   */
  const initialize = useCallback(async (user: User) => {
    if (!isEnabled) {
      unifiedChatLogger.debug('Unified chat disabled, skipping initialization');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info('Initializing unified chat for user:', user.uid);

      // Get UnifiedChatManager instance
      const manager = UnifiedChatManager.getInstance(unifiedChatConfig);
      await manager.initialize(user);

      userRef.current = user;
      setChatManager(manager);
      setIsInitialized(true);

      // Set up event listeners
      setupEventListeners();

      unifiedChatLogger.info('Unified chat initialized successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during initialization';
      unifiedChatLogger.error('Failed to initialize unified chat:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled]);

  /**
   * Create or get existing session
   */
  const createOrGetSession = useCallback(async (
    sessionId: string,
    sessionName: string,
    agentId?: string,
    guestParticipants?: string[]
  ): Promise<ChatSession | null> => {
    if (!isEnabled || !chatManager) {
      unifiedChatLogger.warn('Cannot create session: unified chat not enabled or not initialized');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info('Creating or getting session:', sessionId);

      const session = await chatManager.createOrGetSession(
        sessionId,
        sessionName,
        agentId,
        guestParticipants
      );

      setCurrentSession(session);
      setParticipants(session.participants);

      unifiedChatLogger.info('Session ready:', session.id, 'mode:', session.mode);
      return session;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error creating session';
      unifiedChatLogger.error('Failed to create or get session:', err);
      setError(errorMessage);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, chatManager]);

  /**
   * Send message to current session
   */
  const sendMessage = useCallback(async (
    content: string,
    target?: MessageTarget
  ): Promise<Message | null> => {
    if (!isEnabled || !chatManager || !currentSession) {
      unifiedChatLogger.warn('Cannot send message: unified chat not enabled, not initialized, or no active session');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info('Sending message to session:', currentSession.id);

      const message = await chatManager.sendMessage(
        currentSession.id,
        content,
        target
      );

      unifiedChatLogger.info('Message sent:', message.id);
      return message;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error sending message';
      unifiedChatLogger.error('Failed to send message:', err);
      setError(errorMessage);
      return null;
    }
  }, [isEnabled, currentSession]);

  /**
   * Add participant
   */
  const addParticipant = useCallback(async (userId: string, role: string = 'participant') => {
    if (!isEnabled || !chatManager || !currentSession) {
      unifiedChatLogger.debug('Cannot add participant: unified chat not available or no active session');
      return;
    }

    try {
      setError(null);

      unifiedChatLogger.verbose('Adding participant:', userId, 'with role:', role);

      await chatManager.addParticipant(currentSession.id, userId, role);

      unifiedChatLogger.info('Participant added:', userId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error adding participant';
      unifiedChatLogger.error('Failed to add participant:', err);
      setError(errorMessage);
    }
  }, [isEnabled, currentSession]);

  /**
   * Remove participant
   */
  const removeParticipant = useCallback(async (userId: string) => {
    if (!isEnabled || !chatManager || !currentSession) {
      unifiedChatLogger.debug('Cannot remove participant: unified chat not available or no active session');
      return;
    }

    try {
      setError(null);

      unifiedChatLogger.verbose('Removing participant:', userId);

      await chatManager.removeParticipant(currentSession.id, userId);

      unifiedChatLogger.info('Participant removed:', userId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error removing participant';
      unifiedChatLogger.error('Failed to remove participant:', err);
      setError(errorMessage);
    }
  }, [isEnabled, currentSession]);

  /**
   * Set typing status
   */
  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!isEnabled || !chatManager || !currentSession) {
      return;
    }

    try {
      await chatManager.setTypingStatus(currentSession.id, isTyping);
      unifiedChatLogger.verbose('Typing status set:', isTyping);
    } catch (err) {
      unifiedChatLogger.error('Failed to set typing status:', err);
    }
  }, [isEnabled, currentSession]);

  /**
   * Set up event listeners
   */
  const setupEventListeners = useCallback(() => {
    if (!chatManager) return;

    const manager = chatManager;

    // Message events
    const onMessageReceived = (message: Message) => {
      unifiedChatLogger.verbose('Message received:', message.id);
      setMessages(prev => [...prev, message]);
    };

    const onMessageDelivered = (message: Message) => {
      unifiedChatLogger.verbose('Message delivered:', message.id);
      setMessages(prev => prev.map(m => m.id === message.id ? message : m));
    };

    // Participant events
    const onParticipantJoined = (participant: Participant) => {
      unifiedChatLogger.verbose('Participant joined:', participant.userId);
      setParticipants(prev => [...prev.filter(p => p.userId !== participant.userId), participant]);
    };

    const onParticipantLeft = (participant: Participant) => {
      unifiedChatLogger.verbose('Participant left:', participant.userId);
      setParticipants(prev => prev.filter(p => p.userId !== participant.userId));
    };

    const onParticipantUpdated = (participant: Participant) => {
      unifiedChatLogger.verbose('Participant updated:', participant.userId);
      setParticipants(prev => prev.map(p => p.userId === participant.userId ? participant : p));
    };

    // Typing events
    const onTypingStatusChanged = (data: { userId: string; isTyping: boolean }) => {
      unifiedChatLogger.verbose('Typing status changed:', data.userId, data.isTyping);
      setTypingParticipants(prev => {
        if (data.isTyping) {
          return [...prev.filter(id => id !== data.userId), data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
    };

    // Presence events
    const onPresenceChanged = (data: { userId: string; isOnline: boolean }) => {
      unifiedChatLogger.verbose('Presence changed:', data.userId, data.isOnline);
      setOnlineParticipants(prev => {
        if (data.isOnline) {
          return [...prev.filter(id => id !== data.userId), data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
    };

    // Session events
    const onSessionModeChanged = (data: { sessionId: string; mode: 'regular' | 'shared' }) => {
      unifiedChatLogger.info('Session mode changed:', data.sessionId, 'to', data.mode);
      if (currentSession && currentSession.id === data.sessionId) {
        setCurrentSession(prev => prev ? { ...prev, mode: data.mode } : null);
      }
    };

    // Register event listeners
    manager.on('messageReceived', onMessageReceived);
    manager.on('participantJoined', onParticipantJoined);
    manager.on('participantLeft', onParticipantLeft);
    manager.on('typingStarted', onTypingStarted);
    manager.on('typingStopped', onTypingStopped);
    manager.on('participantOnline', onParticipantOnline);
    manager.on('participantOffline', onParticipantOffline);

    // Store listeners for cleanup
    eventListenersRef.current.set('messageReceived', onMessageReceived);
    eventListenersRef.current.set('messageDelivered', onMessageDelivered);
    eventListenersRef.current.set('participantJoined', onParticipantJoined);
    eventListenersRef.current.set('participantLeft', onParticipantLeft);
    eventListenersRef.current.set('participantUpdated', onParticipantUpdated);
    eventListenersRef.current.set('typingStatusChanged', onTypingStatusChanged);
    eventListenersRef.current.set('presenceChanged', onPresenceChanged);
    eventListenersRef.current.set('sessionModeChanged', onSessionModeChanged);

    unifiedChatLogger.debug('Event listeners set up');
  }, [currentSession]);

  /**
   * Cleanup
   */
  const cleanup = useCallback(async () => {
    unifiedChatLogger.debug('Cleaning up unified chat hook');

    // Remove event listeners
    if (chatManager) {
      for (const [event, listener] of eventListenersRef.current) {
        chatManager.off(event, listener);
      }
    }

    if (chatManager) {
      await chatManager.cleanup();
    }

    // Reset state
    setIsInitialized(false);
    setCurrentSession(null);
    setMessages([]);
    setParticipants([]);
    setTypingParticipants([]);
    setOnlineParticipants([]);
    setError(null);

    // Clear refs
    setChatManager(null);
    userRef.current = null;
    eventListenersRef.current.clear();
  }, [chatManager]);

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && initialSessionId && initialSessionName && userRef.current) {
      createOrGetSession(initialSessionId, initialSessionName, initialAgentId, initialParticipants);
    }
  }, [autoInitialize, initialSessionId, initialSessionName, initialAgentId, initialParticipants, createOrGetSession]);

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
    isLoading,
    error,
    
    // Current session
    currentSession,
    messages,
    participants,
    
    // Real-time status
    typingParticipants,
    onlineParticipants,
    
    // Manager access
    manager: chatManager,
    
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

