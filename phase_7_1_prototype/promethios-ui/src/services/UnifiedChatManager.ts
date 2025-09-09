/**
 * UnifiedChatManager - Central orchestration for all chat functionality
 * 
 * Handles both regular (1-on-1) and shared (multi-participant) conversations
 * with seamless mode switching and consistent state management.
 * 
 * Design Principles:
 * - Optimized for 1-10 participants maximum
 * - Single source of truth for chat state
 * - Automatic mode detection and switching
 * - Integrated with notification system
 * - Real-time synchronization for small groups
 */

import { User } from 'firebase/auth';
import { ChatStateManager, ChatMode, ChatState } from './ChatStateManager';
import { MessageRouter, Message, MessageTarget } from './MessageRouter';
import { ParticipantManager, Participant, ParticipantRole } from './ParticipantManager';
import { NotificationBridge, NotificationEvent } from './NotificationBridge';
import { FirebaseChatPersistence } from './FirebaseChatPersistence';

export interface UnifiedChatConfig {
  maxParticipants: number;
  optimalParticipants: number;
  warningThreshold: number;
  enableRealTimeSync: boolean;
  enableTypingIndicators: boolean;
  enableNotifications: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  mode: ChatMode;
  participants: Participant[];
  hostUserId: string;
  agentId?: string;
  createdAt: Date;
  lastActivity: Date;
  metadata: {
    isPrivate: boolean;
    allowInvites: boolean;
    linkedSessionId?: string; // For hybrid mode
  };
}

export class UnifiedChatManager {
  private static instance: UnifiedChatManager;
  
  private readonly config: UnifiedChatConfig;
  private readonly stateManager: ChatStateManager;
  private readonly messageRouter: MessageRouter;
  private readonly participantManager: ParticipantManager;
  private readonly notificationBridge: NotificationBridge;
  private readonly persistence: FirebaseChatPersistence;
  
  private activeSessions: Map<string, ChatSession> = new Map();
  private currentUser: User | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  private constructor(config: Partial<UnifiedChatConfig> = {}) {
    this.config = {
      maxParticipants: 10,
      optimalParticipants: 5,
      warningThreshold: 8,
      enableRealTimeSync: true,
      enableTypingIndicators: true,
      enableNotifications: true,
      ...config
    };

    // Initialize core components
    this.stateManager = new ChatStateManager();
    this.messageRouter = new MessageRouter(this.config);
    this.participantManager = new ParticipantManager(this.config);
    this.notificationBridge = new NotificationBridge();
    this.persistence = new FirebaseChatPersistence();

    // Set up component communication
    this.setupComponentIntegration();
    
    console.log('🎯 [UnifiedChatManager] Initialized with config:', this.config);
  }

  public static getInstance(config?: Partial<UnifiedChatConfig>): UnifiedChatManager {
    if (!UnifiedChatManager.instance) {
      UnifiedChatManager.instance = new UnifiedChatManager(config);
    }
    return UnifiedChatManager.instance;
  }

  /**
   * Initialize the chat manager with current user
   */
  public async initialize(user: User): Promise<void> {
    this.currentUser = user;
    
    console.log('🚀 [UnifiedChatManager] Initializing for user:', user.uid);
    
    // Initialize all components
    await Promise.all([
      this.stateManager.initialize(user),
      this.messageRouter.initialize(user),
      this.participantManager.initialize(user),
      this.notificationBridge.initialize(user),
      this.persistence.initialize(user)
    ]);

    // Load existing sessions
    await this.loadUserSessions();
    
    console.log('✅ [UnifiedChatManager] Initialization complete');
  }

  /**
   * Create or get a chat session
   */
  public async createOrGetSession(
    sessionId: string,
    name: string,
    agentId?: string,
    initialParticipants: string[] = []
  ): Promise<ChatSession> {
    if (!this.currentUser) {
      throw new Error('User not initialized');
    }

    // Check if session already exists
    let session = this.activeSessions.get(sessionId);
    if (session) {
      console.log('📋 [UnifiedChatManager] Using existing session:', sessionId);
      return session;
    }

    // Determine initial mode based on participants
    const mode: ChatMode = initialParticipants.length > 0 ? 'shared' : 'regular';
    
    // Create new session
    session = {
      id: sessionId,
      name,
      mode,
      participants: [],
      hostUserId: this.currentUser.uid,
      agentId,
      createdAt: new Date(),
      lastActivity: new Date(),
      metadata: {
        isPrivate: false,
        allowInvites: true,
        linkedSessionId: mode === 'shared' ? sessionId : undefined
      }
    };

    // Store session in memory FIRST so addParticipant can find it
    this.activeSessions.set(sessionId, session);

    // Persist session to Firebase BEFORE adding participants (so updateSession calls work)
    await this.persistence.saveSession(session);
    console.log('💾 [UnifiedChatManager] Session persisted to Firebase:', sessionId);

    // Add host as first participant
    await this.participantManager.addParticipant(sessionId, {
      userId: this.currentUser.uid,
      name: this.currentUser.displayName || this.currentUser.email || 'Host',
      role: 'host',
      joinedAt: new Date(),
      isOnline: true,
      permissions: ['read', 'write', 'invite', 'moderate']
    });

    // Add initial participants
    for (const participantId of initialParticipants) {
      await this.addParticipant(sessionId, participantId, 'participant');
    }
  }

  /**
   * Add a participant to a session
   */
  public async addParticipant(sessionId: string, userId: string, role: ParticipantRole = 'participant'): Promise<void> {
    console.log('👥 [UnifiedChatManager] Starting addParticipant process:', {
      sessionId,
      userId,
      role,
      timestamp: new Date().toISOString()
    });

    try {
      // Validate inputs
      console.log('🔍 [UnifiedChatManager] Validating addParticipant inputs...');
      if (!sessionId) {
        console.error('❌ [UnifiedChatManager] Missing sessionId');
        throw new Error('Session ID is required');
      }
      if (!userId) {
        console.error('❌ [UnifiedChatManager] Missing userId');
        throw new Error('User ID is required');
      }
      console.log('✅ [UnifiedChatManager] Input validation passed');

      // Check if session exists
      console.log('🔍 [UnifiedChatManager] Checking if session exists...');
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        console.error('❌ [UnifiedChatManager] Session not found:', sessionId);
        console.log('🔍 [UnifiedChatManager] Available sessions:', Array.from(this.activeSessions.keys()));
        throw new Error(`Session ${sessionId} not found`);
      }
      console.log('✅ [UnifiedChatManager] Session found:', {
        sessionId: session.id,
        sessionName: session.name,
        currentParticipants: session.participants.length,
        maxParticipants: this.config.maxParticipants
      });

      // Check if user is already a participant
      console.log('🔍 [UnifiedChatManager] Checking if user is already a participant...');
      const existingParticipant = session.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        console.log('⚠️ [UnifiedChatManager] User is already a participant:', {
          userId,
          existingRole: existingParticipant.role,
          newRole: role
        });
        // Update role if different
        if (existingParticipant.role !== role) {
          console.log('🔄 [UnifiedChatManager] Updating participant role');
          existingParticipant.role = role;
          existingParticipant.permissions = role === 'host' ? ['read', 'write', 'invite', 'moderate'] : ['read', 'write'];
        }
        return;
      }

      // Check participant limit
      console.log('🔍 [UnifiedChatManager] Checking participant limit...');
      if (session.participants.length >= this.config.maxParticipants) {
        console.error('❌ [UnifiedChatManager] Session has reached maximum participants:', {
          current: session.participants.length,
          max: this.config.maxParticipants
        });
        throw new Error(`Session ${sessionId} has reached maximum participants (${this.config.maxParticipants})`);
      }
      console.log('✅ [UnifiedChatManager] Participant limit check passed');

      // Add participant via ParticipantManager
      console.log('👥 [UnifiedChatManager] Adding participant via ParticipantManager...');
      try {
        await this.participantManager.addParticipant(sessionId, {
          userId,
          name: `User ${userId}`, // Will be resolved by ParticipantManager
          role,
          joinedAt: new Date(),
          isOnline: true,
          permissions: role === 'host' ? ['read', 'write', 'invite', 'moderate'] : ['read', 'write']
        });
        console.log('✅ [UnifiedChatManager] Participant added via ParticipantManager');
      } catch (error) {
        console.error('❌ [UnifiedChatManager] Error adding participant via ParticipantManager:', error);
        throw error;
      }

      // Update session mode if needed
      console.log('🔍 [UnifiedChatManager] Checking if session mode needs update...');
      const currentMode = session.mode;
      const newMode = this.determineSessionMode(session);
      console.log('🔍 [UnifiedChatManager] Mode check result:', {
        currentMode,
        newMode,
        needsUpdate: newMode !== currentMode
      });
      
      if (newMode !== session.mode) {
        console.log('🔄 [UnifiedChatManager] Switching session mode...');
        try {
          await this.switchSessionMode(sessionId, newMode);
          console.log('✅ [UnifiedChatManager] Session mode switched successfully');
        } catch (error) {
          console.error('❌ [UnifiedChatManager] Error switching session mode:', error);
          // Don't throw here, mode switch failure shouldn't prevent participant addition
        }
      }

      // Update last activity and persist session
      console.log('💾 [UnifiedChatManager] Updating session last activity and persisting...');
      session.lastActivity = new Date();
      
      console.log('💾 [UnifiedChatManager] Session data before persistence:', {
        sessionId: session.id,
        participantCount: session.participants.length,
        lastActivity: session.lastActivity,
        metadata: session.metadata,
        hasUndefinedInMetadata: session.metadata ? Object.entries(session.metadata).some(([k, v]) => v === undefined) : false
      });

      try {
        await this.persistence.updateSession(session);
        console.log('✅ [UnifiedChatManager] Session persisted successfully');
      } catch (error) {
        console.error('❌ [UnifiedChatManager] Error persisting session:', {
          error: error instanceof Error ? error.message : error,
          sessionId: session.id,
          metadata: session.metadata
        });
        throw error;
      }

      console.log('✅ [UnifiedChatManager] Successfully added participant:', {
        userId,
        sessionId,
        role,
        totalParticipants: session.participants.length
      });
      
      // Emit participant added event
      console.log('📡 [UnifiedChatManager] Emitting participantAdded event');
      this.emit('participantAdded', { sessionId, userId, role });

    } catch (error) {
      console.error('❌ [UnifiedChatManager] Unexpected error in addParticipant:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        userId,
        role
      });
      throw error;
    }
  }

  /**
   * Remove a participant from a session
   */
  public async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Remove participant
    await this.participantManager.removeParticipant(sessionId, userId);

    // Update session mode if needed
    const newMode = this.determineSessionMode(session);
    if (newMode !== session.mode) {
      await this.switchSessionMode(sessionId, newMode);
    }

    // Update last activity
    session.lastActivity = new Date();
    await this.persistence.updateSession(session);

    console.log('👥 [UnifiedChatManager] Removed participant:', userId, 'from session:', sessionId);
    
    // Emit participant removed event
    this.emit('participantRemoved', { sessionId, userId });
  }

  /**
   * Send a message in a session
   */
  public async sendMessage(
    sessionId: string,
    content: string,
    target?: MessageTarget,
    attachments: string[] = []
  ): Promise<Message> {
    if (!this.currentUser) {
      throw new Error('User not initialized');
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Create message
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      senderId: this.currentUser.uid,
      senderName: this.currentUser.displayName || this.currentUser.email || 'User',
      content,
      target,
      attachments,
      timestamp: new Date(),
      delivered: false,
      read: false
    };

    // Route message through MessageRouter
    const deliveredMessage = await this.messageRouter.routeMessage(message, session);

    // Update session last activity
    session.lastActivity = new Date();
    await this.persistence.updateSession(session);

    // Clear typing indicator
    await this.participantManager.setTypingStatus(sessionId, this.currentUser.uid, false);

    console.log('💬 [UnifiedChatManager] Message sent:', message.id, 'in session:', sessionId);
    
    // Emit message sent event
    this.emit('messageSent', deliveredMessage);

    return deliveredMessage;
  }

  /**
   * Set typing status for current user
   */
  public async setTypingStatus(sessionId: string, isTyping: boolean): Promise<void> {
    if (!this.currentUser) return;

    await this.participantManager.setTypingStatus(sessionId, this.currentUser.uid, isTyping);
    
    // Emit typing status event
    this.emit('typingStatusChanged', { sessionId, userId: this.currentUser.uid, isTyping });
  }

  /**
   * Get session by ID - loads from Firebase if not in memory
   */
  public async getSession(sessionId: string): Promise<ChatSession | undefined> {
    // First check memory
    let session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Try to load from Firebase persistence using global session lookup
      console.log('🔍 [UnifiedChatManager] Session not in memory, loading from Firebase:', sessionId);
      try {
        session = await this.persistence.getSession(sessionId);
        
        if (session) {
          // Add to memory for future access
          this.activeSessions.set(sessionId, session);
          console.log('✅ [UnifiedChatManager] Session loaded from Firebase:', sessionId);
        } else {
          console.log('❌ [UnifiedChatManager] Session not found in Firebase:', sessionId);
        }
      } catch (error) {
        console.error('❌ [UnifiedChatManager] Error loading session from Firebase:', error);
      }
    }
    
    return session || undefined;
  }

  /**
   * Get session by ID (synchronous version for backward compatibility)
   */
  public getSessionSync(sessionId: string): ChatSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions for current user
   */
  public getUserSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values())
      .filter(session => 
        session.participants.some(p => p.userId === this.currentUser?.uid)
      );
  }

  /**
   * Switch session mode (regular ↔ shared)
   */
  private async switchSessionMode(sessionId: string, newMode: ChatMode): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const oldMode = session.mode;
    session.mode = newMode;

    // Update state manager
    await this.stateManager.setActiveSession(sessionId, newMode);

    // Update persistence
    await this.persistence.updateSession(session);

    console.log(`🔄 [UnifiedChatManager] Session ${sessionId} mode changed: ${oldMode} → ${newMode}`);
    
    // Emit mode changed event
    this.emit('sessionModeChanged', { sessionId, oldMode, newMode });
  }

  /**
   * Determine appropriate mode based on session participants
   */
  private determineSessionMode(session: ChatSession): ChatMode {
    // Count human participants (exclude AI agents)
    const humanParticipants = session.participants.filter(p => p.role !== 'agent');
    
    // If more than 1 human participant, use shared mode
    return humanParticipants.length > 1 ? 'shared' : 'regular';
  }

  /**
   * Load existing sessions for user
   */
  private async loadUserSessions(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const sessions = await this.persistence.getUserSessions(this.currentUser.uid);
      
      for (const session of sessions) {
        this.activeSessions.set(session.id, session);
        
        // Load participants for each session
        const participants = await this.participantManager.getSessionParticipants(session.id);
        session.participants = participants;
      }

      console.log(`📋 [UnifiedChatManager] Loaded ${sessions.length} sessions for user`);
    } catch (error) {
      console.error('❌ [UnifiedChatManager] Failed to load user sessions:', error);
    }
  }

  /**
   * Set up communication between components
   */
  private setupComponentIntegration(): void {
    // ParticipantManager → NotificationBridge
    this.participantManager.on('participantJoined', (event) => {
      this.notificationBridge.handleEvent('participantJoined', event);
    });

    this.participantManager.on('participantLeft', (event) => {
      this.notificationBridge.handleEvent('participantLeft', event);
    });

    this.participantManager.on('typingStatusChanged', (event) => {
      this.notificationBridge.handleEvent('typingStatusChanged', event);
    });

    // MessageRouter → NotificationBridge
    this.messageRouter.on('messageDelivered', (event) => {
      this.notificationBridge.handleEvent('messageDelivered', event);
    });

    // StateManager → All components
    this.stateManager.on('stateChanged', (state) => {
      this.messageRouter.updateState(state);
      this.participantManager.updateState(state);
    });
  }

  /**
   * Event system for external components
   */
  public on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  public off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`❌ [UnifiedChatManager] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [UnifiedChatManager] Cleaning up resources');
    
    await Promise.all([
      this.stateManager.cleanup(),
      this.messageRouter.cleanup(),
      this.participantManager.cleanup(),
      this.notificationBridge.cleanup(),
      this.persistence.cleanup()
    ]);

    this.activeSessions.clear();
    this.eventListeners.clear();
    this.currentUser = null;
  }
}

export default UnifiedChatManager;

