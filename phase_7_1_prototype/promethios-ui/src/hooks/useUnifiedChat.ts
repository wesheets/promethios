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

// Global hook registry to maintain state across component re-renders
interface HookState {
  isInitialized: boolean;
  chatManager: UnifiedChatManager | null;
  user: User | null;
  instanceId: string;
}

const globalHookRegistry = new Map<string, HookState>();

export const useUnifiedChat = (options: UseUnifiedChatOptions = {}): UseUnifiedChatReturn => {
  const {
    sessionId: initialSessionId,
    sessionName: initialSessionName,
    agentId: initialAgentId,
    initialParticipants = [],
    autoInitialize = true
  } = options;

  // Generate stable hook key based on options (for component identity)
  const hookKey = `${initialSessionId || 'default'}_${initialAgentId || 'default'}`;
  
  // Generate unique instance ID for this hook (stable across re-renders)
  const instanceId = useRef(`hook_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`);
  
  // Get or create global state for this hook key
  const getGlobalState = useCallback((): HookState => {
    if (!globalHookRegistry.has(hookKey)) {
      globalHookRegistry.set(hookKey, {
        isInitialized: false,
        chatManager: null,
        user: null,
        instanceId: instanceId.current
      });
    }
    return globalHookRegistry.get(hookKey)!;
  }, [hookKey]);

  // Update global state
  const updateGlobalState = useCallback((updates: Partial<HookState>) => {
    const currentState = getGlobalState();
    globalHookRegistry.set(hookKey, { ...currentState, ...updates });
  }, [hookKey, getGlobalState]);
  
  // CRITICAL FIX: Use refs for persistent state that survives re-renders
  const isInitializedRef = useRef(false);
  const chatManagerRef = useRef<UnifiedChatManager | null>(null);
  const userRef = useRef<User | null>(null);
  
  // React state for triggering re-renders (but not the source of truth)
  const [isInitialized, setIsInitialized] = useState(() => getGlobalState().isInitialized);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [typingParticipants, setTypingParticipants] = useState<string[]>([]);
  const [onlineParticipants, setOnlineParticipants] = useState<string[]>([]);
  
  // Initialize refs from global state
  useEffect(() => {
    const globalState = getGlobalState();
    isInitializedRef.current = globalState.isInitialized;
    chatManagerRef.current = globalState.chatManager;
    userRef.current = globalState.user;
    
    // Sync React state with global state
    if (globalState.isInitialized !== isInitialized) {
      setIsInitialized(globalState.isInitialized);
      unifiedChatLogger.info(`🔄 [useUnifiedChat:${instanceId.current}] Synced React state with global state:`, {
        'global isInitialized': globalState.isInitialized,
        'React isInitialized': isInitialized,
        'updated to': globalState.isInitialized
      });
    }
  }, [getGlobalState, isInitialized]);

  // Refs for stable references
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Check if unified chat is enabled
  const isEnabled = isUnifiedChatEnabled();

  // Debug: Track hook instance creation
  useEffect(() => {
    unifiedChatLogger.info(`🆔 [useUnifiedChat] Hook instance created: ${instanceId.current} for key: ${hookKey}`);
    return () => {
      unifiedChatLogger.info(`🗑️ [useUnifiedChat] Hook instance destroyed: ${instanceId.current} for key: ${hookKey}`);
    };
  }, [hookKey]);

  // Debug: Track state changes with instance ID
  useEffect(() => {
    unifiedChatLogger.info(`🔍 [useUnifiedChat:${instanceId.current}] State changed:`, {
      isInitialized,
      hasManager: !!chatManagerRef.current,
      managerType: typeof chatManagerRef.current,
      isLoading,
      error,
      hookKey
    });
  }, [isInitialized, isLoading, error, hookKey]);

  /**
   * Initialize the unified chat system
   */
  const initialize = useCallback(async (user: User) => {
    if (!isEnabled) {
      unifiedChatLogger.debug(`[${instanceId.current}] Unified chat disabled, skipping initialization`);
      return;
    }

    // CRITICAL FIX: Check persistent ref AND global state
    const globalState = getGlobalState();
    if (globalState.isInitialized && globalState.chatManager) {
      unifiedChatLogger.info(`[${instanceId.current}] Already initialized in global state, reusing`);
      
      // Sync local refs with global state
      isInitializedRef.current = globalState.isInitialized;
      chatManagerRef.current = globalState.chatManager;
      userRef.current = globalState.user;
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

      unifiedChatLogger.info(`🔧 [useUnifiedChat:${instanceId.current}] About to update hook state...`);
      unifiedChatLogger.info(`🔧 [useUnifiedChat:${instanceId.current}] Manager instance:`, manager);

      // CRITICAL FIX: Update persistent refs first
      userRef.current = user;
      chatManagerRef.current = manager;
      isInitializedRef.current = true;

      // Update global state registry
      updateGlobalState({
        isInitialized: true,
        chatManager: manager,
        user: user
      });

      // Then update React state to trigger re-renders
      setIsInitialized(true);

      unifiedChatLogger.info(`🔧 [useUnifiedChat:${instanceId.current}] State updates called - persistent refs, global state, and React state updated`);
      unifiedChatLogger.info(`🔧 [useUnifiedChat:${instanceId.current}] Post-update state check:`, {
        'isInitializedRef.current': isInitializedRef.current,
        'chatManagerRef.current': !!chatManagerRef.current,
        'React isInitialized': isInitialized,
        'Global state': getGlobalState()
      });

      // Set up event listeners after state is updated
      setTimeout(() => {
        setupEventListeners();
      }, 0);

      unifiedChatLogger.info(`[${instanceId.current}] Unified chat initialized successfully`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during initialization';
      unifiedChatLogger.error(`[${instanceId.current}] Failed to initialize unified chat:`, err);
      setError(errorMessage);
      
      // Reset refs and global state on error
      isInitializedRef.current = false;
      chatManagerRef.current = null;
      updateGlobalState({
        isInitialized: false,
        chatManager: null,
        user: null
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, getGlobalState, updateGlobalState]);

  /**
   * Create or get existing session
   */
  const createOrGetSession = useCallback(async (
    sessionId: string,
    sessionName: string,
    agentId?: string,
    guestParticipants?: string[]
  ): Promise<ChatSession | null> => {
    if (!isEnabled || !chatManagerRef.current) {
      unifiedChatLogger.warn('Cannot create session: unified chat not enabled or not initialized');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info('Creating or getting session:', sessionId);

      const session = await chatManagerRef.current.createOrGetSession(
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
  }, [isEnabled]);

  /**
   * Send message to current session
   */
  const sendMessage = useCallback(async (
    content: string,
    target?: MessageTarget
  ): Promise<Message | null> => {
    if (!isEnabled || !chatManagerRef.current || !currentSession) {
      unifiedChatLogger.warn('Cannot send message: unified chat not enabled, not initialized, or no active session');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      unifiedChatLogger.info('Sending message to session:', currentSession.id);

      const message = await chatManagerRef.current.sendMessage(
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
    if (!isEnabled || !chatManagerRef.current || !currentSession) {
      unifiedChatLogger.debug('Cannot add participant: unified chat not available or no active session');
      return;
    }

    try {
      setError(null);

      unifiedChatLogger.verbose('Adding participant:', userId, 'with role:', role);

      await chatManagerRef.current.addParticipant(currentSession.id, userId, role);

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
    if (!isEnabled || !chatManagerRef.current || !currentSession) {
      unifiedChatLogger.debug('Cannot remove participant: unified chat not available or no active session');
      return;
    }

    try {
      setError(null);

      unifiedChatLogger.verbose('Removing participant:', userId);

      await chatManagerRef.current.removeParticipant(currentSession.id, userId);

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
    if (!isEnabled || !chatManagerRef.current || !currentSession) {
      return;
    }

    try {
      await chatManagerRef.current.setTypingStatus(currentSession.id, isTyping);
      unifiedChatLogger.verbose('Typing status set:', isTyping);
    } catch (err) {
      unifiedChatLogger.error('Failed to set typing status:', err);
    }
  }, [isEnabled, currentSession]);

  /**
   * Set up event listeners
   */
  const setupEventListeners = useCallback(() => {
    if (!chatManagerRef.current) return;

    const manager = chatManagerRef.current;

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
    const onTypingStarted = (data: { userId: string }) => {
      unifiedChatLogger.verbose('Typing started:', data.userId);
      setTypingParticipants(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    };

    const onTypingStopped = (data: { userId: string }) => {
      unifiedChatLogger.verbose('Typing stopped:', data.userId);
      setTypingParticipants(prev => prev.filter(id => id !== data.userId));
    };

    // Presence events
    const onParticipantOnline = (data: { userId: string }) => {
      unifiedChatLogger.verbose('Participant online:', data.userId);
      setOnlineParticipants(prev => [...prev.filter(id => id !== data.userId), data.userId]);
    };

    const onParticipantOffline = (data: { userId: string }) => {
      unifiedChatLogger.verbose('Participant offline:', data.userId);
      setOnlineParticipants(prev => prev.filter(id => id !== data.userId));
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
    manager.on('messageDelivered', onMessageDelivered);
    manager.on('participantJoined', onParticipantJoined);
    manager.on('participantLeft', onParticipantLeft);
    manager.on('participantUpdated', onParticipantUpdated);
    manager.on('typingStarted', onTypingStarted);
    manager.on('typingStopped', onTypingStopped);
    manager.on('participantOnline', onParticipantOnline);
    manager.on('participantOffline', onParticipantOffline);
    manager.on('sessionModeChanged', onSessionModeChanged);

    // Store listeners for cleanup
    eventListenersRef.current.set('messageReceived', onMessageReceived);
    eventListenersRef.current.set('messageDelivered', onMessageDelivered);
    eventListenersRef.current.set('participantJoined', onParticipantJoined);
    eventListenersRef.current.set('participantLeft', onParticipantLeft);
    eventListenersRef.current.set('participantUpdated', onParticipantUpdated);
    eventListenersRef.current.set('typingStarted', onTypingStarted);
    eventListenersRef.current.set('typingStopped', onTypingStopped);
    eventListenersRef.current.set('participantOnline', onParticipantOnline);
    eventListenersRef.current.set('participantOffline', onParticipantOffline);
    eventListenersRef.current.set('sessionModeChanged', onSessionModeChanged);

    unifiedChatLogger.debug('Event listeners set up');
  }, [currentSession]);

  /**
   * Cleanup
   */
  const cleanup = useCallback(async () => {
    unifiedChatLogger.debug('Cleaning up unified chat hook');

    // Remove event listeners
    if (chatManagerRef.current) {
      for (const [event, listener] of eventListenersRef.current) {
        chatManagerRef.current.off(event, listener);
      }
    }

    if (chatManagerRef.current) {
      await chatManagerRef.current.cleanup();
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
    isInitializedRef.current = false;
    chatManagerRef.current = null;
    userRef.current = null;
    eventListenersRef.current.clear();

    // Clear global state registry
    globalHookRegistry.delete(hookKey);
  }, [hookKey]);

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
    isInitialized: isInitializedRef.current, // CRITICAL FIX: Use persistent ref
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
    manager: chatManagerRef.current, // CRITICAL FIX: Use persistent ref
    
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

