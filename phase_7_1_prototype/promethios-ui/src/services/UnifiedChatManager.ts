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

    // Store session
    this.activeSessions.set(sessionId, session);
    
    // Persist to Firebase
    await this.persistence.saveSession(session);
    
    // Update state manager
    await this.stateManager.setActiveSession(sessionId, mode);
    
    console.log('✅ [UnifiedChatManager] Created session:', sessionId, 'mode:', mode);
    
    // Emit session created event
    this.emit('sessionCreated', session);
    
    return session;
  }

  /**
   * Add a participant to a session
   */
  public async addParticipant(
    sessionId: string,
    userId: string,
    role: ParticipantRole = 'participant'
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check participant limit
    if (session.participants.length >= this.config.maxParticipants) {
      throw new Error(`Session ${sessionId} has reached maximum participants (${this.config.maxParticipants})`);
    }

    // Add participant
    await this.participantManager.addParticipant(sessionId, {
      userId,
      name: `User ${userId}`, // Will be resolved by ParticipantManager
      role,
      joinedAt: new Date(),
      isOnline: true,
      permissions: role === 'host' ? ['read', 'write', 'invite', 'moderate'] : ['read', 'write']
    });

    // Update session mode if needed
    const newMode = this.determineSessionMode(session);
    if (newMode !== session.mode) {
      await this.switchSessionMode(sessionId, newMode);
    }

    // Update last activity
    session.lastActivity = new Date();
    await this.persistence.updateSession(session);

    console.log('👥 [UnifiedChatManager] Added participant:', userId, 'to session:', sessionId);
    
    // Emit participant added event
    this.emit('participantAdded', { sessionId, userId, role });
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
   * Get session by ID
   */
  public getSession(sessionId: string): ChatSession | undefined {
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

