/**
 * Real-time MAS Collaboration Service
 * 
 * Enables real-time synchronization and collaboration for multi-agent conversations.
 * Supports live conversation updates, participant presence, and collaborative editing.
 */

import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  SavedMASConversation, 
  ConversationMessage,
  AuditLogShare,
  GovernanceInsight
} from '../persistence/MASPersistenceService';
import { unifiedMASPersistence } from '../persistence/UnifiedMASPersistenceService';

export interface ParticipantPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  isActive: boolean;
  lastSeen: Date;
  currentActivity: 'viewing' | 'typing' | 'thinking' | 'idle';
  cursorPosition?: {
    messageId?: string;
    elementId?: string;
  };
}

export interface LiveConversationUpdate {
  type: 'message_added' | 'message_updated' | 'audit_log_shared' | 'governance_insight' | 'participant_joined' | 'participant_left' | 'typing_indicator';
  conversationId: string;
  timestamp: Date;
  userId: string;
  data: any;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  agentId?: string;
  agentName?: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface CollaborationSession {
  conversationId: string;
  participants: ParticipantPresence[];
  activeUsers: number;
  sessionStartTime: Date;
  lastActivity: Date;
  isLive: boolean;
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export class RealtimeMASCollaborationService {
  private static instance: RealtimeMASCollaborationService;
  private conversationSubscriptions: Map<string, RealtimeSubscription> = new Map();
  private presenceSubscriptions: Map<string, RealtimeSubscription> = new Map();
  private typingIndicators: Map<string, TypingIndicator[]> = new Map();
  private currentUser: { uid: string; displayName?: string; photoURL?: string } | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): RealtimeMASCollaborationService {
    if (!RealtimeMASCollaborationService.instance) {
      RealtimeMASCollaborationService.instance = new RealtimeMASCollaborationService();
    }
    return RealtimeMASCollaborationService.instance;
  }

  // ==================== INITIALIZATION ====================

  private initializeService(): void {
    // Start heartbeat for presence updates
    this.startHeartbeat();

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updatePresence('idle');
      } else {
        this.updatePresence('viewing');
      }
    });

    // Handle beforeunload to clean up presence
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }

  private async sendHeartbeat(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Update presence in all active conversations
      for (const conversationId of this.conversationSubscriptions.keys()) {
        await this.updatePresenceInConversation(conversationId, {
          isActive: true,
          lastSeen: new Date(),
          currentActivity: 'viewing'
        });
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  }

  // ==================== USER MANAGEMENT ====================

  setCurrentUser(user: { uid: string; displayName?: string; photoURL?: string } | null): void {
    this.currentUser = user;
  }

  getCurrentUser(): { uid: string; displayName?: string; photoURL?: string } | null {
    return this.currentUser;
  }

  // ==================== CONVERSATION COLLABORATION ====================

  /**
   * Join a conversation for real-time collaboration
   */
  async joinConversation(conversationId: string): Promise<CollaborationSession> {
    if (!this.currentUser) {
      throw new Error('User must be authenticated to join conversation');
    }

    try {
      // Add user to conversation participants
      await this.addParticipantToConversation(conversationId);

      // Subscribe to conversation updates
      const subscription = this.subscribeToConversationUpdates(conversationId);
      this.conversationSubscriptions.set(conversationId, subscription);

      // Subscribe to presence updates
      const presenceSubscription = this.subscribeToPresenceUpdates(conversationId);
      this.presenceSubscriptions.set(conversationId, presenceSubscription);

      // Get current session info
      const session = await this.getCollaborationSession(conversationId);

      console.log('Joined conversation for real-time collaboration:', conversationId);
      return session;
    } catch (error) {
      console.error('Error joining conversation:', error);
      throw error;
    }
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Remove user from conversation participants
      await this.removeParticipantFromConversation(conversationId);

      // Unsubscribe from updates
      const subscription = this.conversationSubscriptions.get(conversationId);
      if (subscription) {
        subscription.unsubscribe();
        this.conversationSubscriptions.delete(conversationId);
      }

      const presenceSubscription = this.presenceSubscriptions.get(conversationId);
      if (presenceSubscription) {
        presenceSubscription.unsubscribe();
        this.presenceSubscriptions.delete(conversationId);
      }

      // Clear typing indicators
      this.typingIndicators.delete(conversationId);

      console.log('Left conversation:', conversationId);
    } catch (error) {
      console.error('Error leaving conversation:', error);
    }
  }

  /**
   * Subscribe to real-time conversation updates
   */
  private subscribeToConversationUpdates(conversationId: string): RealtimeSubscription {
    const conversationRef = doc(db, 'mas_conversations', conversationId);
    
    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const conversation: SavedMASConversation = {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SavedMASConversation;

        // Emit conversation update event
        this.emitConversationUpdate({
          type: 'message_added', // This would be determined by comparing with previous state
          conversationId,
          timestamp: new Date(),
          userId: this.currentUser?.uid || 'unknown',
          data: conversation
        });
      }
    }, (error) => {
      console.error('Error in conversation subscription:', error);
    });

    return { unsubscribe };
  }

  /**
   * Subscribe to presence updates
   */
  private subscribeToPresenceUpdates(conversationId: string): RealtimeSubscription {
    const presenceQuery = query(
      collection(db, 'conversation_presence'),
      where('conversationId', '==', conversationId),
      where('isActive', '==', true)
    );
    
    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const participants: ParticipantPresence[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        participants.push({
          userId: data.userId,
          userName: data.userName,
          userAvatar: data.userAvatar,
          isActive: data.isActive,
          lastSeen: data.lastSeen?.toDate() || new Date(),
          currentActivity: data.currentActivity || 'viewing',
          cursorPosition: data.cursorPosition
        });
      });

      // Emit presence update event
      this.emitPresenceUpdate(conversationId, participants);
    }, (error) => {
      console.error('Error in presence subscription:', error);
    });

    return { unsubscribe };
  }

  // ==================== PRESENCE MANAGEMENT ====================

  /**
   * Update user presence in conversation
   */
  async updatePresence(activity: 'viewing' | 'typing' | 'thinking' | 'idle'): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Update presence in all active conversations
      for (const conversationId of this.conversationSubscriptions.keys()) {
        await this.updatePresenceInConversation(conversationId, {
          currentActivity: activity,
          lastSeen: new Date(),
          isActive: activity !== 'idle'
        });
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  private async updatePresenceInConversation(
    conversationId: string, 
    updates: Partial<ParticipantPresence>
  ): Promise<void> {
    if (!this.currentUser) return;

    try {
      const presenceRef = doc(db, 'conversation_presence', `${conversationId}_${this.currentUser.uid}`);
      
      await updateDoc(presenceRef, {
        ...updates,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating presence in conversation:', error);
    }
  }

  private async addParticipantToConversation(conversationId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      const presenceRef = doc(db, 'conversation_presence', `${conversationId}_${this.currentUser.uid}`);
      
      await updateDoc(presenceRef, {
        conversationId,
        userId: this.currentUser.uid,
        userName: this.currentUser.displayName || 'Anonymous User',
        userAvatar: this.currentUser.photoURL,
        isActive: true,
        lastSeen: serverTimestamp(),
        currentActivity: 'viewing',
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding participant to conversation:', error);
    }
  }

  private async removeParticipantFromConversation(conversationId: string): Promise<void> {
    if (!this.currentUser) return;

    try {
      const presenceRef = doc(db, 'conversation_presence', `${conversationId}_${this.currentUser.uid}`);
      
      await updateDoc(presenceRef, {
        isActive: false,
        leftAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error removing participant from conversation:', error);
    }
  }

  // ==================== TYPING INDICATORS ====================

  /**
   * Set typing indicator for user or agent
   */
  async setTypingIndicator(
    conversationId: string, 
    isTyping: boolean, 
    agentId?: string, 
    agentName?: string
  ): Promise<void> {
    if (!this.currentUser) return;

    try {
      const indicator: TypingIndicator = {
        userId: this.currentUser.uid,
        userName: this.currentUser.displayName || 'Anonymous User',
        agentId,
        agentName,
        isTyping,
        timestamp: new Date()
      };

      // Update local typing indicators
      const conversationIndicators = this.typingIndicators.get(conversationId) || [];
      const existingIndex = conversationIndicators.findIndex(
        i => i.userId === this.currentUser!.uid && i.agentId === agentId
      );

      if (existingIndex >= 0) {
        if (isTyping) {
          conversationIndicators[existingIndex] = indicator;
        } else {
          conversationIndicators.splice(existingIndex, 1);
        }
      } else if (isTyping) {
        conversationIndicators.push(indicator);
      }

      this.typingIndicators.set(conversationId, conversationIndicators);

      // Broadcast typing indicator
      await this.broadcastTypingIndicator(conversationId, indicator);

      // Auto-clear typing indicator after 3 seconds
      if (isTyping) {
        setTimeout(() => {
          this.setTypingIndicator(conversationId, false, agentId, agentName);
        }, 3000);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  private async broadcastTypingIndicator(
    conversationId: string, 
    indicator: TypingIndicator
  ): Promise<void> {
    try {
      const typingRef = doc(db, 'conversation_typing', `${conversationId}_${indicator.userId}_${indicator.agentId || 'user'}`);
      
      if (indicator.isTyping) {
        await updateDoc(typingRef, {
          conversationId,
          userId: indicator.userId,
          userName: indicator.userName,
          agentId: indicator.agentId,
          agentName: indicator.agentName,
          isTyping: true,
          timestamp: serverTimestamp(),
          expiresAt: new Date(Date.now() + 5000) // Expire after 5 seconds
        });
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          timestamp: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
    }
  }

  /**
   * Get current typing indicators for conversation
   */
  getTypingIndicators(conversationId: string): TypingIndicator[] {
    return this.typingIndicators.get(conversationId) || [];
  }

  // ==================== LIVE UPDATES ====================

  /**
   * Send live message update
   */
  async sendLiveMessage(
    conversationId: string, 
    message: ConversationMessage
  ): Promise<void> {
    try {
      // Add message to conversation via unified persistence
      await unifiedMASPersistence.saveConversation({
        conversationId,
        messages: [message]
      } as any);

      // Broadcast live update
      this.emitConversationUpdate({
        type: 'message_added',
        conversationId,
        timestamp: new Date(),
        userId: this.currentUser?.uid || 'system',
        data: message
      });

      // Clear typing indicator
      await this.setTypingIndicator(conversationId, false, message.agentId);
    } catch (error) {
      console.error('Error sending live message:', error);
      throw error;
    }
  }

  /**
   * Send live audit log share
   */
  async sendLiveAuditLogShare(
    conversationId: string, 
    auditLogShare: AuditLogShare
  ): Promise<void> {
    try {
      // Add audit log share via unified persistence
      // This would be implemented in the unified persistence service
      
      // Broadcast live update
      this.emitConversationUpdate({
        type: 'audit_log_shared',
        conversationId,
        timestamp: new Date(),
        userId: this.currentUser?.uid || 'system',
        data: auditLogShare
      });
    } catch (error) {
      console.error('Error sending live audit log share:', error);
      throw error;
    }
  }

  /**
   * Send live governance insight
   */
  async sendLiveGovernanceInsight(
    conversationId: string, 
    insight: GovernanceInsight
  ): Promise<void> {
    try {
      // Broadcast live update
      this.emitConversationUpdate({
        type: 'governance_insight',
        conversationId,
        timestamp: new Date(),
        userId: this.currentUser?.uid || 'system',
        data: insight
      });
    } catch (error) {
      console.error('Error sending live governance insight:', error);
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  private async getCollaborationSession(conversationId: string): Promise<CollaborationSession> {
    try {
      // Get current participants from presence collection
      const presenceQuery = query(
        collection(db, 'conversation_presence'),
        where('conversationId', '==', conversationId),
        where('isActive', '==', true)
      );

      // This would be implemented with actual Firestore query
      // For now, return a mock session
      return {
        conversationId,
        participants: [],
        activeUsers: 0,
        sessionStartTime: new Date(),
        lastActivity: new Date(),
        isLive: true
      };
    } catch (error) {
      console.error('Error getting collaboration session:', error);
      throw error;
    }
  }

  // ==================== EVENT HANDLING ====================

  private conversationUpdateCallbacks: Map<string, (update: LiveConversationUpdate) => void> = new Map();
  private presenceUpdateCallbacks: Map<string, (conversationId: string, participants: ParticipantPresence[]) => void> = new Map();

  /**
   * Subscribe to conversation updates
   */
  onConversationUpdate(
    conversationId: string, 
    callback: (update: LiveConversationUpdate) => void
  ): () => void {
    const key = `${conversationId}_${Date.now()}`;
    this.conversationUpdateCallbacks.set(key, callback);
    
    return () => {
      this.conversationUpdateCallbacks.delete(key);
    };
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(
    conversationId: string, 
    callback: (conversationId: string, participants: ParticipantPresence[]) => void
  ): () => void {
    const key = `${conversationId}_${Date.now()}`;
    this.presenceUpdateCallbacks.set(key, callback);
    
    return () => {
      this.presenceUpdateCallbacks.delete(key);
    };
  }

  private emitConversationUpdate(update: LiveConversationUpdate): void {
    this.conversationUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in conversation update callback:', error);
      }
    });
  }

  private emitPresenceUpdate(conversationId: string, participants: ParticipantPresence[]): void {
    this.presenceUpdateCallbacks.forEach(callback => {
      try {
        callback(conversationId, participants);
      } catch (error) {
        console.error('Error in presence update callback:', error);
      }
    });
  }

  // ==================== CONFLICT RESOLUTION ====================

  /**
   * Handle concurrent editing conflicts
   */
  async resolveEditingConflict(
    conversationId: string, 
    conflictData: any
  ): Promise<void> {
    try {
      // Implement operational transformation or similar conflict resolution
      console.log('Resolving editing conflict for conversation:', conversationId);
      
      // For now, use last-write-wins strategy
      // In a production system, this would use more sophisticated conflict resolution
    } catch (error) {
      console.error('Error resolving editing conflict:', error);
    }
  }

  // ==================== CLEANUP ====================

  private cleanup(): void {
    // Clear all subscriptions
    this.conversationSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.conversationSubscriptions.clear();

    this.presenceSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.presenceSubscriptions.clear();

    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear typing indicators
    this.typingIndicators.clear();

    // Clear callbacks
    this.conversationUpdateCallbacks.clear();
    this.presenceUpdateCallbacks.clear();
  }

  /**
   * Destroy the service
   */
  destroy(): void {
    this.cleanup();
  }

  // ==================== ANALYTICS ====================

  /**
   * Track collaboration metrics
   */
  async trackCollaborationMetrics(
    conversationId: string, 
    metrics: {
      participantCount: number;
      sessionDuration: number;
      messageCount: number;
      auditLogShares: number;
      conflictsResolved: number;
    }
  ): Promise<void> {
    try {
      const metricsRef = doc(db, 'collaboration_metrics', `${conversationId}_${Date.now()}`);
      
      await updateDoc(metricsRef, {
        conversationId,
        ...metrics,
        timestamp: serverTimestamp(),
        userId: this.currentUser?.uid
      });
    } catch (error) {
      console.error('Error tracking collaboration metrics:', error);
    }
  }
}

// Export singleton instance
export const realtimeMASCollaboration = RealtimeMASCollaborationService.getInstance();

