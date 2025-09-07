/**
 * MessageRouter - Intelligent message delivery system
 * 
 * Handles message routing for both regular and shared conversations,
 * with support for targeted messaging and delivery confirmation.
 */

import { User } from 'firebase/auth';
import { ChatState } from './ChatStateManager';
import { ChatSession } from './UnifiedChatManager';

export interface MessageTarget {
  type: 'all' | 'user' | 'agent' | 'role';
  id?: string; // userId, agentId, or role name
  name?: string; // Display name for UI
}

export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  target?: MessageTarget;
  attachments: string[];
  timestamp: Date;
  delivered: boolean;
  read: boolean;
  metadata?: {
    messageType?: 'text' | 'system' | 'notification';
    priority?: 'low' | 'normal' | 'high';
    threadId?: string;
    replyToId?: string;
  };
}

export interface MessageDeliveryResult {
  message: Message;
  deliveredTo: string[];
  failedDeliveries: { userId: string; error: string }[];
  deliveryTime: Date;
}

export interface MessageRouterConfig {
  maxParticipants: number;
  enableDeliveryConfirmation: boolean;
  enableReadReceipts: boolean;
  messageRetentionDays: number;
}

export class MessageRouter {
  private config: MessageRouterConfig;
  private user: User | null = null;
  private currentState: ChatState | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private messageQueue: Map<string, Message[]> = new Map(); // For offline delivery
  private deliveryCallbacks: Map<string, Function> = new Map();

  constructor(config: Partial<MessageRouterConfig> = {}) {
    this.config = {
      maxParticipants: 10,
      enableDeliveryConfirmation: true,
      enableReadReceipts: true,
      messageRetentionDays: 30,
      ...config
    };

    console.log('📮 [MessageRouter] Initialized with config:', this.config);
  }

  /**
   * Initialize with user context
   */
  public async initialize(user: User): Promise<void> {
    this.user = user;
    console.log('📮 [MessageRouter] Initialized for user:', user.uid);
  }

  /**
   * Route a message to appropriate recipients
   */
  public async routeMessage(message: Message, session: ChatSession): Promise<Message> {
    console.log('📮 [MessageRouter] Routing message:', message.id, 'in session:', session.id);

    // Determine recipients based on target and session mode
    const recipients = this.determineRecipients(message, session);
    
    // Deliver message to recipients
    const deliveryResult = await this.deliverMessage(message, recipients, session);
    
    // Update message with delivery status
    const deliveredMessage = {
      ...message,
      delivered: deliveryResult.failedDeliveries.length === 0,
      metadata: {
        ...message.metadata,
        deliveryTime: deliveryResult.deliveryTime,
        deliveredTo: deliveryResult.deliveredTo,
        failedDeliveries: deliveryResult.failedDeliveries
      }
    };

    // Emit delivery event
    this.emit('messageDelivered', deliveryResult);

    console.log('✅ [MessageRouter] Message delivered:', message.id, 
      `(${deliveryResult.deliveredTo.length} recipients)`);

    return deliveredMessage;
  }

  /**
   * Determine message recipients based on target and session
   */
  private determineRecipients(message: Message, session: ChatSession): string[] {
    const recipients: string[] = [];

    if (!message.target || message.target.type === 'all') {
      // Send to all participants except sender
      recipients.push(
        ...session.participants
          .filter(p => p.userId !== message.senderId)
          .map(p => p.userId)
      );
    } else if (message.target.type === 'user' && message.target.id) {
      // Send to specific user
      recipients.push(message.target.id);
    } else if (message.target.type === 'agent' && message.target.id) {
      // Send to specific agent
      recipients.push(message.target.id);
    } else if (message.target.type === 'role') {
      // Send to all participants with specific role
      recipients.push(
        ...session.participants
          .filter(p => p.role === message.target!.id && p.userId !== message.senderId)
          .map(p => p.userId)
      );
    }

    console.log('🎯 [MessageRouter] Recipients determined:', recipients, 'for target:', message.target);
    return recipients;
  }

  /**
   * Deliver message to recipients
   */
  private async deliverMessage(
    message: Message,
    recipients: string[],
    session: ChatSession
  ): Promise<MessageDeliveryResult> {
    const deliveredTo: string[] = [];
    const failedDeliveries: { userId: string; error: string }[] = [];

    // Route based on session mode
    if (session.mode === 'regular') {
      // Regular mode: use existing chat system
      await this.deliverToRegularChat(message, recipients, deliveredTo, failedDeliveries);
    } else {
      // Shared mode: use shared conversation system
      await this.deliverToSharedChat(message, recipients, session, deliveredTo, failedDeliveries);
    }

    return {
      message,
      deliveredTo,
      failedDeliveries,
      deliveryTime: new Date()
    };
  }

  /**
   * Deliver message in regular chat mode
   */
  private async deliverToRegularChat(
    message: Message,
    recipients: string[],
    deliveredTo: string[],
    failedDeliveries: { userId: string; error: string }[]
  ): Promise<void> {
    try {
      // Use existing ChatHistoryService for regular delivery
      const { ChatHistoryService } = await import('./ChatHistoryService');
      const chatHistoryService = ChatHistoryService.getInstance();

      // Add message to chat session
      await chatHistoryService.addMessageToSession(message.sessionId, {
        id: message.id,
        content: message.content,
        sender: message.senderId,
        timestamp: message.timestamp.toISOString(),
        attachments: message.attachments,
        metadata: message.metadata
      });

      // Mark as delivered to all recipients
      deliveredTo.push(...recipients);

      console.log('📮 [MessageRouter] Delivered to regular chat:', message.id);
    } catch (error) {
      console.error('❌ [MessageRouter] Failed to deliver to regular chat:', error);
      
      // Mark all recipients as failed
      recipients.forEach(recipientId => {
        failedDeliveries.push({
          userId: recipientId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }
  }

  /**
   * Deliver message in shared chat mode
   */
  private async deliverToSharedChat(
    message: Message,
    recipients: string[],
    session: ChatSession,
    deliveredTo: string[],
    failedDeliveries: { userId: string; error: string }[]
  ): Promise<void> {
    try {
      // Check if this is a hybrid session (linked to regular chat)
      if (session.metadata.linkedSessionId) {
        // Hybrid mode: deliver to both regular chat AND shared conversation
        await this.deliverToRegularChat(message, recipients, deliveredTo, failedDeliveries);
        
        // Also notify shared conversation participants
        await this.notifySharedParticipants(message, recipients, session);
      } else {
        // Pure shared mode: use SharedConversationService
        const { default: SharedConversationService } = await import('./SharedConversationService');
        const sharedService = SharedConversationService.getInstance();

        await sharedService.sendMessageToSharedConversation(
          session.id,
          message.senderId,
          message.senderName,
          message.content
        );

        // Mark as delivered to all recipients
        deliveredTo.push(...recipients);
      }

      console.log('📮 [MessageRouter] Delivered to shared chat:', message.id);
    } catch (error) {
      console.error('❌ [MessageRouter] Failed to deliver to shared chat:', error);
      
      // Mark all recipients as failed
      recipients.forEach(recipientId => {
        failedDeliveries.push({
          userId: recipientId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }
  }

  /**
   * Notify shared conversation participants (for hybrid mode)
   */
  private async notifySharedParticipants(
    message: Message,
    recipients: string[],
    session: ChatSession
  ): Promise<void> {
    // This would integrate with the notification system
    // to ensure shared participants get real-time updates
    console.log('🔔 [MessageRouter] Notifying shared participants:', recipients);
    
    // Emit event for notification system
    this.emit('sharedParticipantNotification', {
      message,
      recipients,
      sessionId: session.id
    });
  }

  /**
   * Mark message as read by user
   */
  public async markAsRead(messageId: string, userId: string): Promise<void> {
    console.log('👁️ [MessageRouter] Marking message as read:', messageId, 'by user:', userId);
    
    // Emit read receipt event
    this.emit('messageRead', { messageId, userId, timestamp: new Date() });
  }

  /**
   * Get message delivery status
   */
  public async getDeliveryStatus(messageId: string): Promise<any> {
    // This would query the delivery status from persistence layer
    console.log('📊 [MessageRouter] Getting delivery status for:', messageId);
    
    // Return mock status for now
    return {
      messageId,
      delivered: true,
      read: false,
      deliveredAt: new Date(),
      readAt: null
    };
  }

  /**
   * Queue message for offline delivery
   */
  public queueMessage(sessionId: string, message: Message): void {
    if (!this.messageQueue.has(sessionId)) {
      this.messageQueue.set(sessionId, []);
    }
    
    this.messageQueue.get(sessionId)!.push(message);
    console.log('📥 [MessageRouter] Queued message for offline delivery:', message.id);
  }

  /**
   * Process queued messages when back online
   */
  public async processQueuedMessages(sessionId: string): Promise<void> {
    const queuedMessages = this.messageQueue.get(sessionId);
    if (!queuedMessages || queuedMessages.length === 0) return;

    console.log('📤 [MessageRouter] Processing queued messages:', queuedMessages.length);

    // Process each queued message
    for (const message of queuedMessages) {
      try {
        // This would need session context to route properly
        // For now, just emit the event
        this.emit('queuedMessageProcessed', message);
      } catch (error) {
        console.error('❌ [MessageRouter] Failed to process queued message:', error);
      }
    }

    // Clear the queue
    this.messageQueue.delete(sessionId);
  }

  /**
   * Update state from ChatStateManager
   */
  public updateState(state: ChatState): void {
    this.currentState = state;
    console.log('🔄 [MessageRouter] State updated:', state.mode, 'mode');
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
          console.error(`❌ [MessageRouter] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 [MessageRouter] Cleaning up');
    
    this.eventListeners.clear();
    this.messageQueue.clear();
    this.deliveryCallbacks.clear();
    this.user = null;
    this.currentState = null;
  }
}

export default MessageRouter;

