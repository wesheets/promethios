/**
 * UnifiedGuestChatService - Handles guest access to host conversations
 * Replaces the separate SharedConversationService for guest users
 */

import { doc, getDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { userInteractionRegistry } from './UserInteractionRegistry';
import { chatHistoryService, ChatSession } from './ChatHistoryService';

export interface GuestConversationAccess {
  id: string; // Invitation ID
  hostUserId: string;
  hostUserName: string;
  conversationId: string; // Host's conversation ID
  conversationName: string;
  agentName?: string;
  lastActivity: Date;
  unreadCount: number;
  status: 'active' | 'pending';
}

class UnifiedGuestChatService {
  private static instance: UnifiedGuestChatService;

  private constructor() {}

  public static getInstance(): UnifiedGuestChatService {
    if (!UnifiedGuestChatService.instance) {
      UnifiedGuestChatService.instance = new UnifiedGuestChatService();
    }
    return UnifiedGuestChatService.instance;
  }

  /**
   * Get all conversations that the guest has access to (accepted invitations)
   */
  async getGuestConversationAccess(guestUserId: string): Promise<GuestConversationAccess[]> {
    try {
      console.log('🔍 [UnifiedGuestChat] Loading guest conversation access for:', guestUserId);
      
      // Get all accepted invitations for this user
      const acceptedInvitations = await userInteractionRegistry.getUserInteractions(
        guestUserId,
        'collaboration_invitation',
        'accepted'
      );
      
      console.log('🔍 [UnifiedGuestChat] Found accepted invitations:', acceptedInvitations.length);
      
      const guestAccess: GuestConversationAccess[] = [];
      
      for (const invitation of acceptedInvitations) {
        if (invitation.metadata?.conversationId) {
          const access: GuestConversationAccess = {
            id: invitation.id,
            hostUserId: invitation.fromUserId,
            hostUserName: invitation.fromUserName || 'Host',
            conversationId: invitation.metadata.conversationId,
            conversationName: invitation.metadata.conversationName || 'Shared Chat',
            agentName: invitation.metadata.agentName,
            lastActivity: invitation.updatedAt?.toDate() || new Date(),
            unreadCount: 0, // TODO: Implement unread count tracking
            status: 'active'
          };
          
          guestAccess.push(access);
        }
      }
      
      console.log('✅ [UnifiedGuestChat] Loaded guest access:', guestAccess.length);
      return guestAccess;
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error loading guest conversation access:', error);
      return [];
    }
  }

  /**
   * Get the host's chat session that the guest has access to
   */
  async getHostChatSession(hostUserId: string, conversationId: string): Promise<ChatSession | null> {
    try {
      console.log('🔍 [UnifiedGuestChat] Loading host chat session:', { hostUserId, conversationId });
      
      // Load the host's chat session directly
      const chatSession = await chatHistoryService.getChatSessionById(conversationId);
      
      if (chatSession) {
        console.log('✅ [UnifiedGuestChat] Loaded host chat session:', chatSession.name);
        return chatSession;
      } else {
        console.warn('⚠️ [UnifiedGuestChat] Host chat session not found:', conversationId);
        return null;
      }
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error loading host chat session:', error);
      return null;
    }
  }

  /**
   * Send a message to the host's conversation as a guest
   */
  async sendMessageToHostConversation(
    hostUserId: string,
    conversationId: string,
    guestUserId: string,
    guestUserName: string,
    message: string
  ): Promise<void> {
    try {
      console.log('🔍 [UnifiedGuestChat] Sending message to host conversation:', {
        hostUserId,
        conversationId,
        guestUserId,
        message: message.substring(0, 50) + '...'
      });
      
      // Add the message to the host's chat session
      await chatHistoryService.addMessageToChatSession(conversationId, {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: message,
        sender: 'user',
        timestamp: new Date(),
        metadata: {
          userId: guestUserId,
          userName: guestUserName,
          isGuestMessage: true
        }
      });
      
      console.log('✅ [UnifiedGuestChat] Message sent to host conversation');
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error sending message to host conversation:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listener for host's conversation messages
   */
  setupHostConversationListener(
    conversationId: string,
    onMessagesUpdate: (messages: any[]) => void
  ): () => void {
    console.log('🔍 [UnifiedGuestChat] Setting up host conversation listener:', conversationId);
    
    // Listen to the host's chat session for real-time updates
    return chatHistoryService.subscribeToSession(conversationId, (session) => {
      if (session?.messages) {
        console.log('🔄 [UnifiedGuestChat] Host conversation messages updated:', session.messages.length);
        onMessagesUpdate(session.messages);
      }
    });
  }
}

export default UnifiedGuestChatService;

