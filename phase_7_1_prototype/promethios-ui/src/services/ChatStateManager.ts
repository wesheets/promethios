/**
 * ChatStateManager - Consistent state management across all chat modes
 * 
 * Manages the global chat state and ensures consistency between
 * regular and shared conversation modes.
 */

import { User } from 'firebase/auth';

export type ChatMode = 'regular' | 'shared';

export interface ChatState {
  currentSessionId: string | null;
  mode: ChatMode;
  isLoading: boolean;
  isTyping: boolean;
  lastActivity: Date | null;
  participantCount: number;
  unreadCount: number;
  error: string | null;
}

export interface StateChangeEvent {
  sessionId: string;
  oldState: Partial<ChatState>;
  newState: Partial<ChatState>;
  timestamp: Date;
}

export class ChatStateManager {
  private static instance: ChatStateManager | null = null;
  private currentState: ChatState;
  private stateHistory: StateChangeEvent[] = [];
  private eventListeners: Map<string, Function[]> = new Map();
  private user: User | null = null;

  constructor() {
    this.currentState = {
      currentSessionId: null,
      mode: 'regular',
      isLoading: false,
      isTyping: false,
      lastActivity: null,
      participantCount: 0,
      unreadCount: 0,
      error: null
    };

    console.log('🎛️ [ChatStateManager] Initialized with default state');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ChatStateManager {
    if (!ChatStateManager.instance) {
      ChatStateManager.instance = new ChatStateManager();
    }
    return ChatStateManager.instance;
  }

  /**
   * Initialize with user context
   */
  public async initialize(user: User): Promise<void> {
    this.user = user;
    console.log('🎛️ [ChatStateManager] Initialized for user:', user.uid);
  }

  /**
   * Get current chat state
   */
  public getState(): ChatState {
    return { ...this.currentState };
  }

  /**
   * Set active session and mode
   */
  public async setActiveSession(sessionId: string, mode: ChatMode): Promise<void> {
    const oldState = { ...this.currentState };
    
    this.currentState = {
      ...this.currentState,
      currentSessionId: sessionId,
      mode,
      lastActivity: new Date(),
      error: null
    };

    this.recordStateChange(sessionId, oldState, this.currentState);
    this.emit('stateChanged', this.currentState);

    console.log(`🎛️ [ChatStateManager] Active session set: ${sessionId} (${mode} mode)`);
  }

  /**
   * Update loading state
   */
  public setLoading(isLoading: boolean): void {
    if (this.currentState.isLoading === isLoading) return;

    const oldState = { ...this.currentState };
    this.currentState.isLoading = isLoading;

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }
    
    this.emit('loadingChanged', isLoading);
  }

  /**
   * Update typing state
   */
  public setTyping(isTyping: boolean): void {
    if (this.currentState.isTyping === isTyping) return;

    const oldState = { ...this.currentState };
    this.currentState.isTyping = isTyping;

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }

    this.emit('typingChanged', isTyping);
  }

  /**
   * Update participant count
   */
  public setParticipantCount(count: number): void {
    if (this.currentState.participantCount === count) return;

    const oldState = { ...this.currentState };
    this.currentState.participantCount = count;

    // Auto-detect mode change based on participant count
    const newMode: ChatMode = count > 2 ? 'shared' : 'regular'; // 2 = host + agent
    if (newMode !== this.currentState.mode) {
      this.currentState.mode = newMode;
      console.log(`🎛️ [ChatStateManager] Auto-switched to ${newMode} mode (${count} participants)`);
    }

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }

    this.emit('participantCountChanged', count);
    this.emit('stateChanged', this.currentState);
  }

  /**
   * Update unread count
   */
  public setUnreadCount(count: number): void {
    if (this.currentState.unreadCount === count) return;

    const oldState = { ...this.currentState };
    this.currentState.unreadCount = count;

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }

    this.emit('unreadCountChanged', count);
  }

  /**
   * Set error state
   */
  public setError(error: string | null): void {
    if (this.currentState.error === error) return;

    const oldState = { ...this.currentState };
    this.currentState.error = error;

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }

    this.emit('errorChanged', error);
    
    if (error) {
      console.error('🎛️ [ChatStateManager] Error state set:', error);
    } else {
      console.log('🎛️ [ChatStateManager] Error state cleared');
    }
  }

  /**
   * Update last activity timestamp
   */
  public updateActivity(): void {
    this.currentState.lastActivity = new Date();
    this.emit('activityUpdated', this.currentState.lastActivity);
  }

  /**
   * Switch chat mode
   */
  public switchMode(mode: ChatMode): void {
    if (this.currentState.mode === mode) return;

    const oldState = { ...this.currentState };
    this.currentState.mode = mode;

    if (this.currentState.currentSessionId) {
      this.recordStateChange(this.currentState.currentSessionId, oldState, this.currentState);
    }

    this.emit('modeChanged', mode);
    this.emit('stateChanged', this.currentState);

    console.log(`🎛️ [ChatStateManager] Mode switched to: ${mode}`);
  }

  /**
   * Clear current session
   */
  public clearSession(): void {
    const oldState = { ...this.currentState };
    
    this.currentState = {
      ...this.currentState,
      currentSessionId: null,
      mode: 'regular',
      isLoading: false,
      isTyping: false,
      participantCount: 0,
      unreadCount: 0,
      error: null
    };

    if (oldState.currentSessionId) {
      this.recordStateChange(oldState.currentSessionId, oldState, this.currentState);
    }

    this.emit('sessionCleared', null);
    this.emit('stateChanged', this.currentState);

    console.log('🎛️ [ChatStateManager] Session cleared');
  }

  /**
   * Get state history for debugging
   */
  public getStateHistory(): StateChangeEvent[] {
    return [...this.stateHistory];
  }

  /**
   * Check if currently in shared mode
   */
  public isSharedMode(): boolean {
    return this.currentState.mode === 'shared';
  }

  /**
   * Check if session is active
   */
  public hasActiveSession(): boolean {
    return this.currentState.currentSessionId !== null;
  }

  /**
   * Get current session ID
   */
  public getCurrentSessionId(): string | null {
    return this.currentState.currentSessionId;
  }

  /**
   * Record state change for history and debugging
   */
  private recordStateChange(
    sessionId: string,
    oldState: ChatState,
    newState: ChatState
  ): void {
    const event: StateChangeEvent = {
      sessionId,
      oldState: { ...oldState },
      newState: { ...newState },
      timestamp: new Date()
    };

    this.stateHistory.push(event);

    // Keep only last 100 state changes
    if (this.stateHistory.length > 100) {
      this.stateHistory.shift();
    }

    this.emit('stateChangeRecorded', event);
  }

  /**
   * Event system
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
          console.error(`❌ [ChatStateManager] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [ChatStateManager] Cleaning up');
    
    this.eventListeners.clear();
    this.stateHistory = [];
    this.user = null;
    
    this.currentState = {
      currentSessionId: null,
      mode: 'regular',
      isLoading: false,
      isTyping: false,
      lastActivity: null,
      participantCount: 0,
      unreadCount: 0,
      error: null
    };
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    ChatStateManager.instance = null;
  }
}

export default ChatStateManager;

