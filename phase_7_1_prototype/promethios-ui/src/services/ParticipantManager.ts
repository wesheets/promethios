/**
 * ParticipantManager - Handle participant lifecycle and presence
 * 
 * Manages participant joins, leaves, presence status, and typing indicators
 * for both regular and shared conversations.
 */

import { User } from 'firebase/auth';
import { ChatState } from './ChatStateManager';

export type ParticipantRole = 'host' | 'participant' | 'agent' | 'observer';

export interface Participant {
  userId: string;
  name: string;
  displayName?: string;
  avatar?: string;
  role: ParticipantRole;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  isTyping: boolean;
  permissions: string[];
  metadata?: {
    email?: string;
    profileUrl?: string;
    invitedBy?: string;
    invitationId?: string;
  };
}

export interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ParticipantEvent {
  sessionId: string;
  participant: Participant;
  eventType: 'joined' | 'left' | 'updated' | 'typing' | 'presence';
  timestamp: Date;
}

export interface ParticipantManagerConfig {
  maxParticipants: number;
  typingTimeoutMs: number;
  presenceTimeoutMs: number;
  enablePresenceTracking: boolean;
}

export class ParticipantManager {
  private config: ParticipantManagerConfig;
  private user: User | null = null;
  private currentState: ChatState | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  
  // Session participants: sessionId -> participants
  private sessionParticipants: Map<string, Map<string, Participant>> = new Map();
  
  // Typing status: sessionId -> userId -> TypingStatus
  private typingStatus: Map<string, Map<string, TypingStatus>> = new Map();
  
  // Presence tracking: userId -> last seen timestamp
  private presenceTracking: Map<string, Date> = new Map();
  
  // Cleanup timers
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private presenceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<ParticipantManagerConfig> = {}) {
    this.config = {
      maxParticipants: 10,
      typingTimeoutMs: 3000, // 3 seconds
      presenceTimeoutMs: 30000, // 30 seconds
      enablePresenceTracking: true,
      ...config
    };

    console.log('👥 [ParticipantManager] Initialized with config:', this.config);
  }

  /**
   * Initialize with user context
   */
  public async initialize(user: User): Promise<void> {
    this.user = user;
    
    // Start presence tracking for current user
    if (this.config.enablePresenceTracking) {
      this.startPresenceTracking();
    }
    
    console.log('👥 [ParticipantManager] Initialized for user:', user.uid);
  }

  /**
   * Add participant to session
   */
  public async addParticipant(sessionId: string, participant: Participant): Promise<void> {
    // Initialize session participants map if needed
    if (!this.sessionParticipants.has(sessionId)) {
      this.sessionParticipants.set(sessionId, new Map());
    }

    const sessionMap = this.sessionParticipants.get(sessionId)!;
    
    // Check participant limit
    if (sessionMap.size >= this.config.maxParticipants) {
      throw new Error(`Session ${sessionId} has reached maximum participants (${this.config.maxParticipants})`);
    }

    // Resolve participant name if needed
    const resolvedParticipant = await this.resolveParticipantInfo(participant);
    
    // Add to session
    sessionMap.set(participant.userId, resolvedParticipant);
    
    // Update presence
    this.updatePresence(participant.userId);
    
    console.log('👥 [ParticipantManager] Added participant:', participant.userId, 'to session:', sessionId);
    
    // Emit participant joined event
    this.emit('participantJoined', {
      sessionId,
      participant: resolvedParticipant,
      eventType: 'joined',
      timestamp: new Date()
    });
  }

  /**
   * Remove participant from session
   */
  public async removeParticipant(sessionId: string, userId: string): Promise<void> {
    const sessionMap = this.sessionParticipants.get(sessionId);
    if (!sessionMap) return;

    const participant = sessionMap.get(userId);
    if (!participant) return;

    // Remove from session
    sessionMap.delete(userId);
    
    // Clear typing status
    await this.setTypingStatus(sessionId, userId, false);
    
    // Update presence
    participant.isOnline = false;
    participant.lastSeen = new Date();
    
    console.log('👥 [ParticipantManager] Removed participant:', userId, 'from session:', sessionId);
    
    // Emit participant left event
    this.emit('participantLeft', {
      sessionId,
      participant,
      eventType: 'left',
      timestamp: new Date()
    });
  }

  /**
   * Get all participants in a session
   */
  public getSessionParticipants(sessionId: string): Participant[] {
    const sessionMap = this.sessionParticipants.get(sessionId);
    if (!sessionMap) return [];

    return Array.from(sessionMap.values());
  }

  /**
   * Get specific participant
   */
  public getParticipant(sessionId: string, userId: string): Participant | undefined {
    const sessionMap = this.sessionParticipants.get(sessionId);
    return sessionMap?.get(userId);
  }

  /**
   * Update participant information
   */
  public async updateParticipant(
    sessionId: string, 
    userId: string, 
    updates: Partial<Participant>
  ): Promise<void> {
    const sessionMap = this.sessionParticipants.get(sessionId);
    if (!sessionMap) return;

    const participant = sessionMap.get(userId);
    if (!participant) return;

    // Apply updates
    const updatedParticipant = { ...participant, ...updates };
    sessionMap.set(userId, updatedParticipant);

    console.log('👥 [ParticipantManager] Updated participant:', userId, 'in session:', sessionId);
    
    // Emit participant updated event
    this.emit('participantUpdated', {
      sessionId,
      participant: updatedParticipant,
      eventType: 'updated',
      timestamp: new Date()
    });
  }

  /**
   * Set typing status for participant
   */
  public async setTypingStatus(sessionId: string, userId: string, isTyping: boolean): Promise<void> {
    // Initialize typing status map if needed
    if (!this.typingStatus.has(sessionId)) {
      this.typingStatus.set(sessionId, new Map());
    }

    const sessionTyping = this.typingStatus.get(sessionId)!;
    const participant = this.getParticipant(sessionId, userId);
    
    if (!participant) return;

    const typingKey = `${sessionId}_${userId}`;
    
    if (isTyping) {
      // Set typing status
      sessionTyping.set(userId, {
        userId,
        userName: participant.name,
        isTyping: true,
        timestamp: new Date()
      });

      // Clear any existing timer
      if (this.typingTimers.has(typingKey)) {
        clearTimeout(this.typingTimers.get(typingKey)!);
      }

      // Set auto-clear timer
      const timer = setTimeout(() => {
        this.setTypingStatus(sessionId, userId, false);
      }, this.config.typingTimeoutMs);
      
      this.typingTimers.set(typingKey, timer);
      
      console.log('⌨️ [ParticipantManager] User started typing:', userId, 'in session:', sessionId);
    } else {
      // Clear typing status
      sessionTyping.delete(userId);
      
      // Clear timer
      if (this.typingTimers.has(typingKey)) {
        clearTimeout(this.typingTimers.get(typingKey)!);
        this.typingTimers.delete(typingKey);
      }
      
      console.log('⌨️ [ParticipantManager] User stopped typing:', userId, 'in session:', sessionId);
    }

    // Update participant typing status
    if (participant) {
      participant.isTyping = isTyping;
    }

    // Emit typing status changed event
    this.emit('typingStatusChanged', {
      sessionId,
      userId,
      userName: participant.name,
      isTyping,
      timestamp: new Date()
    });
  }

  /**
   * Get typing participants in session
   */
  public getTypingParticipants(sessionId: string): TypingStatus[] {
    const sessionTyping = this.typingStatus.get(sessionId);
    if (!sessionTyping) return [];

    return Array.from(sessionTyping.values()).filter(status => status.isTyping);
  }

  /**
   * Clear typing indicator for participant
   */
  public async clearTypingIndicator(sessionId: string, userId: string): Promise<void> {
    await this.setTypingStatus(sessionId, userId, false);
  }

  /**
   * Update presence for participant
   */
  public updatePresence(userId: string): void {
    if (!this.config.enablePresenceTracking) return;

    this.presenceTracking.set(userId, new Date());
    
    // Update participant online status in all sessions
    for (const [sessionId, sessionMap] of this.sessionParticipants) {
      const participant = sessionMap.get(userId);
      if (participant) {
        participant.isOnline = true;
        participant.lastSeen = new Date();
      }
    }

    // Set presence timeout
    const presenceKey = `presence_${userId}`;
    if (this.presenceTimers.has(presenceKey)) {
      clearTimeout(this.presenceTimers.get(presenceKey)!);
    }

    const timer = setTimeout(() => {
      this.markUserOffline(userId);
    }, this.config.presenceTimeoutMs);
    
    this.presenceTimers.set(presenceKey, timer);
  }

  /**
   * Mark user as offline
   */
  private markUserOffline(userId: string): void {
    console.log('🔴 [ParticipantManager] Marking user offline:', userId);
    
    // Update participant offline status in all sessions
    for (const [sessionId, sessionMap] of this.sessionParticipants) {
      const participant = sessionMap.get(userId);
      if (participant) {
        participant.isOnline = false;
        participant.lastSeen = new Date();
        
        // Clear typing status
        this.setTypingStatus(sessionId, userId, false);
        
        // Emit presence changed event
        this.emit('presenceChanged', {
          sessionId,
          participant,
          eventType: 'presence',
          timestamp: new Date()
        });
      }
    }

    this.presenceTracking.delete(userId);
  }

  /**
   * Get online participants count for session
   */
  public getOnlineParticipantsCount(sessionId: string): number {
    const participants = this.getSessionParticipants(sessionId);
    return participants.filter(p => p.isOnline).length;
  }

  /**
   * Check if user has permission
   */
  public hasPermission(sessionId: string, userId: string, permission: string): boolean {
    const participant = this.getParticipant(sessionId, userId);
    return participant?.permissions.includes(permission) || false;
  }

  /**
   * Grant permission to participant
   */
  public async grantPermission(sessionId: string, userId: string, permission: string): Promise<void> {
    const participant = this.getParticipant(sessionId, userId);
    if (!participant) return;

    if (!participant.permissions.includes(permission)) {
      participant.permissions.push(permission);
      
      await this.updateParticipant(sessionId, userId, { permissions: participant.permissions });
      
      console.log('🔑 [ParticipantManager] Granted permission:', permission, 'to user:', userId);
    }
  }

  /**
   * Revoke permission from participant
   */
  public async revokePermission(sessionId: string, userId: string, permission: string): Promise<void> {
    const participant = this.getParticipant(sessionId, userId);
    if (!participant) return;

    const index = participant.permissions.indexOf(permission);
    if (index > -1) {
      participant.permissions.splice(index, 1);
      
      await this.updateParticipant(sessionId, userId, { permissions: participant.permissions });
      
      console.log('🔑 [ParticipantManager] Revoked permission:', permission, 'from user:', userId);
    }
  }

  /**
   * Resolve participant information from user service
   */
  private async resolveParticipantInfo(participant: Participant): Promise<Participant> {
    try {
      // Try to get user profile information
      const { UserProfileService } = await import('./UserProfileService');
      const userProfileService = UserProfileService.getInstance();
      
      const profile = await userProfileService.getUserProfile(participant.userId);
      
      if (profile) {
        return {
          ...participant,
          name: profile.displayName || profile.email || participant.name,
          displayName: profile.displayName,
          avatar: profile.profilePictureUrl,
          metadata: {
            ...participant.metadata,
            email: profile.email,
            profileUrl: profile.profilePictureUrl
          }
        };
      }
    } catch (error) {
      console.warn('⚠️ [ParticipantManager] Could not resolve participant info:', error);
    }

    return participant;
  }

  /**
   * Start presence tracking for current user
   */
  private startPresenceTracking(): void {
    if (!this.user) return;

    // Update presence every 10 seconds
    const presenceInterval = setInterval(() => {
      if (this.user) {
        this.updatePresence(this.user.uid);
      }
    }, 10000);

    // Store interval for cleanup
    this.presenceTimers.set('currentUserPresence', presenceInterval as any);
    
    console.log('📡 [ParticipantManager] Started presence tracking for current user');
  }

  /**
   * Update state from ChatStateManager
   */
  public updateState(state: ChatState): void {
    this.currentState = state;
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
          console.error(`❌ [ParticipantManager] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [ParticipantManager] Cleaning up');
    
    // Clear all timers
    for (const timer of this.typingTimers.values()) {
      clearTimeout(timer);
    }
    for (const timer of this.presenceTimers.values()) {
      clearTimeout(timer as NodeJS.Timeout);
    }
    
    this.eventListeners.clear();
    this.sessionParticipants.clear();
    this.typingStatus.clear();
    this.presenceTracking.clear();
    this.typingTimers.clear();
    this.presenceTimers.clear();
    this.user = null;
    this.currentState = null;
  }
}

export default ParticipantManager;

