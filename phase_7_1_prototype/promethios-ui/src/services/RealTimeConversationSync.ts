/**
 * RealTimeConversationSync - Real-time synchronization for shared conversations
 * Handles message routing, participant updates, and cross-platform state sync
 */

import SharedConversationService, { SharedMessage, SharedConversation } from './SharedConversationService';

export interface MessageEvent {
  type: 'message_sent' | 'message_received' | 'participant_joined' | 'participant_left' | 'typing_start' | 'typing_stop';
  conversationId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ParticipantPresence {
  userId: string;
  conversationId: string;
  isOnline: boolean;
  lastSeen: Date;
}

class RealTimeConversationSync {
  private static instance: RealTimeConversationSync;
  private sharedConversationService: SharedConversationService;
  private messageListeners: Map<string, Set<(message: SharedMessage) => void>> = new Map();
  private participantListeners: Map<string, Set<(participants: any[]) => void>> = new Map();
  private typingListeners: Map<string, Set<(typing: TypingIndicator[]) => void>> = new Map();
  private conversationMessages: Map<string, SharedMessage[]> = new Map();
  private activeTyping: Map<string, TypingIndicator[]> = new Map();
  private participantPresence: Map<string, ParticipantPresence[]> = new Map();

  private constructor() {
    this.sharedConversationService = SharedConversationService.getInstance();
    this.initializeRealTimeSync();
  }

  public static getInstance(): RealTimeConversationSync {
    if (!RealTimeConversationSync.instance) {
      RealTimeConversationSync.instance = new RealTimeConversationSync();
    }
    return RealTimeConversationSync.instance;
  }

  /**
   * Initialize real-time synchronization
   */
  private initializeRealTimeSync(): void {
    // In real implementation, this would connect to WebSocket server
    // For now, we'll simulate real-time behavior with local state
    console.log('🔄 Initialized real-time conversation sync');
  }

  /**
   * Send message to shared conversation
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    senderType: 'human' | 'ai_agent',
    content: string,
    attachments?: any[]
  ): Promise<SharedMessage> {
    const message: SharedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      senderId,
      senderName,
      senderType,
      content,
      timestamp: new Date(),
      attachments
    };

    // Add to local message store
    const messages = this.conversationMessages.get(conversationId) || [];
    messages.push(message);
    this.conversationMessages.set(conversationId, messages);

    // Notify all listeners for this conversation
    this.notifyMessageListeners(conversationId, message);

    // Update conversation last activity
    await this.updateConversationActivity(conversationId);

    console.log('📤 Sent message to shared conversation:', conversationId, message.id);
    return message;
  }

  /**
   * Get messages for a conversation
   */
  getConversationMessages(conversationId: string): SharedMessage[] {
    return this.conversationMessages.get(conversationId) || [];
  }

  /**
   * Subscribe to messages for a conversation
   */
  subscribeToMessages(
    conversationId: string,
    callback: (message: SharedMessage) => void
  ): () => void {
    const listeners = this.messageListeners.get(conversationId) || new Set();
    listeners.add(callback);
    this.messageListeners.set(conversationId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.messageListeners.get(conversationId);
      if (currentListeners) {
        currentListeners.delete(callback);
        if (currentListeners.size === 0) {
          this.messageListeners.delete(conversationId);
        }
      }
    };
  }

  /**
   * Subscribe to participant updates for a conversation
   */
  subscribeToParticipants(
    conversationId: string,
    callback: (participants: any[]) => void
  ): () => void {
    const listeners = this.participantListeners.get(conversationId) || new Set();
    listeners.add(callback);
    this.participantListeners.set(conversationId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.participantListeners.get(conversationId);
      if (currentListeners) {
        currentListeners.delete(callback);
        if (currentListeners.size === 0) {
          this.participantListeners.delete(conversationId);
        }
      }
    };
  }

  /**
   * Start typing indicator
   */
  startTyping(conversationId: string, userId: string, userName: string): void {
    const typing = this.activeTyping.get(conversationId) || [];
    
    // Remove existing typing indicator for this user
    const filtered = typing.filter(t => t.userId !== userId);
    
    // Add new typing indicator
    filtered.push({
      userId,
      userName,
      conversationId,
      isTyping: true,
      timestamp: new Date()
    });
    
    this.activeTyping.set(conversationId, filtered);
    this.notifyTypingListeners(conversationId);

    console.log('⌨️ User started typing:', userName, conversationId);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(conversationId: string, userId: string): void {
    const typing = this.activeTyping.get(conversationId) || [];
    const filtered = typing.filter(t => t.userId !== userId);
    
    this.activeTyping.set(conversationId, filtered);
    this.notifyTypingListeners(conversationId);

    console.log('⌨️ User stopped typing:', userId, conversationId);
  }

  /**
   * Get typing indicators for conversation
   */
  getTypingIndicators(conversationId: string): TypingIndicator[] {
    return this.activeTyping.get(conversationId) || [];
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(
    conversationId: string,
    callback: (typing: TypingIndicator[]) => void
  ): () => void {
    const listeners = this.typingListeners.get(conversationId) || new Set();
    listeners.add(callback);
    this.typingListeners.set(conversationId, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.typingListeners.get(conversationId);
      if (currentListeners) {
        currentListeners.delete(callback);
        if (currentListeners.size === 0) {
          this.typingListeners.delete(conversationId);
        }
      }
    };
  }

  /**
   * Update participant presence
   */
  updateParticipantPresence(
    conversationId: string,
    userId: string,
    isOnline: boolean
  ): void {
    const presence = this.participantPresence.get(conversationId) || [];
    const existingIndex = presence.findIndex(p => p.userId === userId);
    
    const presenceUpdate: ParticipantPresence = {
      userId,
      conversationId,
      isOnline,
      lastSeen: new Date()
    };

    if (existingIndex >= 0) {
      presence[existingIndex] = presenceUpdate;
    } else {
      presence.push(presenceUpdate);
    }

    this.participantPresence.set(conversationId, presence);
    
    // Update in SharedConversationService
    this.sharedConversationService.updateParticipantStatus(conversationId, userId, isOnline);

    console.log('👤 Updated participant presence:', userId, isOnline ? 'online' : 'offline');
  }

  /**
   * Get participant presence for conversation
   */
  getParticipantPresence(conversationId: string): ParticipantPresence[] {
    return this.participantPresence.get(conversationId) || [];
  }

  /**
   * Join conversation (for real-time sync)
   */
  async joinConversation(conversationId: string, userId: string): Promise<void> {
    // Update presence to online
    this.updateParticipantPresence(conversationId, userId, true);
    
    // Load existing messages
    const messages = this.getConversationMessages(conversationId);
    
    // Notify participant listeners
    this.notifyParticipantListeners(conversationId);
    
    console.log('🚪 User joined conversation for real-time sync:', userId, conversationId);
  }

  /**
   * Leave conversation (for real-time sync)
   */
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    // Update presence to offline
    this.updateParticipantPresence(conversationId, userId, false);
    
    // Stop typing if user was typing
    this.stopTyping(conversationId, userId);
    
    // Notify participant listeners
    this.notifyParticipantListeners(conversationId);
    
    console.log('🚪 User left conversation:', userId, conversationId);
  }

  /**
   * Route message to AI agent
   */
  async routeMessageToAI(
    conversationId: string,
    targetAgentId: string,
    message: string,
    fromUserId: string
  ): Promise<void> {
    // This would integrate with the existing AI routing system
    // For now, we'll simulate an AI response
    
    setTimeout(async () => {
      const aiResponse = `AI response to: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`;
      
      await this.sendMessage(
        conversationId,
        targetAgentId,
        'AI Agent',
        'ai_agent',
        aiResponse
      );
    }, 1000 + Math.random() * 2000); // Simulate AI thinking time
  }

  /**
   * Private helper methods
   */
  private notifyMessageListeners(conversationId: string, message: SharedMessage): void {
    const listeners = this.messageListeners.get(conversationId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    }
  }

  private notifyParticipantListeners(conversationId: string): void {
    const listeners = this.participantListeners.get(conversationId);
    if (listeners) {
      // Get current participants from SharedConversationService
      const conversations = this.sharedConversationService.getUserSharedConversations('current_user');
      const conversation = conversations.find(conv => conv.id === conversationId);
      const participants = conversation?.participants || [];
      
      listeners.forEach(callback => {
        try {
          callback(participants);
        } catch (error) {
          console.error('Error in participant listener:', error);
        }
      });
    }
  }

  private notifyTypingListeners(conversationId: string): void {
    const listeners = this.typingListeners.get(conversationId);
    if (listeners) {
      const typing = this.getTypingIndicators(conversationId);
      listeners.forEach(callback => {
        try {
          callback(typing);
        } catch (error) {
          console.error('Error in typing listener:', error);
        }
      });
    }
  }

  private async updateConversationActivity(conversationId: string): Promise<void> {
    // Update last activity timestamp in SharedConversationService
    // This would be implemented in the SharedConversationService
    console.log('🕒 Updated conversation activity:', conversationId);
  }

  /**
   * Simulate real-time message from another user (for testing)
   */
  simulateIncomingMessage(
    conversationId: string,
    fromUserId: string,
    fromUserName: string,
    content: string
  ): void {
    setTimeout(() => {
      this.sendMessage(conversationId, fromUserId, fromUserName, 'human', content);
    }, 500);
  }

  /**
   * Clean up expired typing indicators
   */
  private cleanupTypingIndicators(): void {
    const now = new Date();
    const timeout = 5000; // 5 seconds

    for (const [conversationId, typing] of this.activeTyping.entries()) {
      const filtered = typing.filter(t => 
        now.getTime() - t.timestamp.getTime() < timeout
      );
      
      if (filtered.length !== typing.length) {
        this.activeTyping.set(conversationId, filtered);
        this.notifyTypingListeners(conversationId);
      }
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupTypingIndicators();
    }, 1000); // Check every second
  }
}

export default RealTimeConversationSync;

