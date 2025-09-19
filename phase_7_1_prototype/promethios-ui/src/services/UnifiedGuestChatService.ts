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
  hostUserAvatar?: string;
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
      console.log('🔍 [UnifiedGuestChat] Calling userInteractionRegistry.getUserInteractions...');
      const acceptedInvitations = await userInteractionRegistry.getUserInteractions(
        guestUserId,
        'collaboration_invitation',
        'accepted'
      );
      
      console.log('🔍 [UnifiedGuestChat] Found accepted invitations:', acceptedInvitations.length);
      console.log('🔍 [UnifiedGuestChat] Accepted invitations details:', acceptedInvitations);
      
      const guestAccess: GuestConversationAccess[] = [];
      
      for (const invitation of acceptedInvitations) {
        console.log('🔍 [UnifiedGuestChat] Processing invitation:', invitation.id);
        console.log('🔍 [UnifiedGuestChat] Invitation metadata:', invitation.metadata);
        console.log('🔍 [UnifiedGuestChat] Conversation ID:', invitation.metadata?.conversationId);
        
        if (invitation.metadata?.conversationId) {
          const access: GuestConversationAccess = {
            id: invitation.id,
            hostUserId: invitation.fromUserId,
            hostUserName: invitation.fromUserName || 'Host',
            hostUserAvatar: invitation.fromUserAvatar,
            conversationId: invitation.metadata.conversationId,
            conversationName: invitation.metadata.conversationName || 'Shared Chat',
            agentName: invitation.metadata.agentName,
            lastActivity: invitation.updatedAt?.toDate() || new Date(),
            unreadCount: 0, // TODO: Implement unread count tracking
            status: 'active'
          };
          
          console.log('✅ [UnifiedGuestChat] Created guest access entry:', access);
          guestAccess.push(access);
        } else {
          console.log('⚠️ [UnifiedGuestChat] Skipping invitation without conversationId:', invitation.id);
        }
      }
      
      console.log('✅ [UnifiedGuestChat] Final guest access array:', guestAccess);
      console.log('✅ [UnifiedGuestChat] Loaded guest access count:', guestAccess.length);
      return guestAccess;
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error loading guest conversation access:', error);
      console.error('❌ [UnifiedGuestChat] Error details:', error);
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
        console.log('🔍 [UnifiedGuestChat] Session participants:', {
          host: chatSession.participants?.host,
          guestCount: chatSession.participants?.guests?.length || 0,
          guests: chatSession.participants?.guests?.map(g => ({ id: g.id, name: g.name, type: g.type }))
        });
        
        // Enrich host user information
        await this.enrichHostUserInfo(chatSession, hostUserId);
        
        // Ensure the host agent is included in participants if not already present
        await this.ensureHostAgentInParticipants(chatSession);
        
        // Enrich agent names with proper names from chatbot profiles
        await this.enrichAgentNames(chatSession);
        
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
   * Enrich host user information in the chat session
   */
  private async enrichHostUserInfo(chatSession: ChatSession, hostUserId: string): Promise<void> {
    try {
      console.log('🔍 [UnifiedGuestChat] Enriching host user info for session:', chatSession.id);
      
      // Try to get host user info from Firebase user profile
      const hostUserDoc = await getDoc(doc(db, 'users', hostUserId));
      let hostUserName = 'Host User';
      let hostUserAvatar: string | undefined;
      
      if (hostUserDoc.exists()) {
        const hostUserData = hostUserDoc.data();
        hostUserName = hostUserData.displayName || hostUserData.name || hostUserName;
        hostUserAvatar = hostUserData.photoURL || hostUserData.avatar;
        console.log('✅ [UnifiedGuestChat] Found host user info from Firebase:', {
          name: hostUserName,
          hasAvatar: !!hostUserAvatar
        });
      } else {
        console.log('⚠️ [UnifiedGuestChat] Host user document not found, using fallback');
      }
      
      // Ensure participants structure exists and update host info
      if (!chatSession.participants) {
        chatSession.participants = {
          host: {
            id: hostUserId,
            name: hostUserName,
            type: 'human',
            avatar: hostUserAvatar,
            joinedAt: chatSession.createdAt,
            lastActive: chatSession.lastUpdated,
            messageCount: chatSession.messages?.filter(m => m.sender === 'user').length || 0
          },
          guests: []
        };
      } else if (chatSession.participants.host) {
        // Update existing host info
        chatSession.participants.host.name = hostUserName;
        chatSession.participants.host.avatar = hostUserAvatar;
        console.log('✅ [UnifiedGuestChat] Updated existing host participant info');
      } else {
        // Create host participant
        chatSession.participants.host = {
          id: hostUserId,
          name: hostUserName,
          type: 'human',
          avatar: hostUserAvatar,
          joinedAt: chatSession.createdAt,
          lastActive: chatSession.lastUpdated,
          messageCount: chatSession.messages?.filter(m => m.sender === 'user').length || 0
        };
        console.log('✅ [UnifiedGuestChat] Created new host participant info');
      }
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error enriching host user info:', error);
    }
  }

  /**
   * Ensure the host agent is properly included in the participants list
   */
  private async ensureHostAgentInParticipants(chatSession: ChatSession): Promise<void> {
    try {
      console.log('🔍 [UnifiedGuestChat] Ensuring host agent in participants for session:', chatSession.id);
      
      // Check if the host agent is already in the guests list
      const hostAgentInGuests = chatSession.participants?.guests?.find(g => 
        g.id === chatSession.agentId && g.type === 'ai_agent'
      );
      
      if (!hostAgentInGuests && chatSession.agentId && chatSession.agentName) {
        console.log('🔧 [UnifiedGuestChat] Adding host agent to participants.guests:', {
          id: chatSession.agentId,
          name: chatSession.agentName
        });
        
        // Ensure participants structure exists
        if (!chatSession.participants) {
          chatSession.participants = {
            host: {
              id: chatSession.userId,
              name: 'Host User',
              type: 'human',
              joinedAt: chatSession.createdAt,
              lastActive: chatSession.lastUpdated,
              messageCount: 0
            },
            guests: []
          };
        }
        
        if (!chatSession.participants.guests) {
          chatSession.participants.guests = [];
        }
        
        // Add the host agent as a guest participant
        const hostAgentParticipant = {
          id: chatSession.agentId,
          name: chatSession.agentName,
          type: 'ai_agent' as const,
          joinedAt: chatSession.createdAt,
          lastActive: chatSession.lastUpdated,
          messageCount: chatSession.messages?.filter(m => m.sender === 'assistant').length || 0,
          status: 'active' as const
        };
        
        chatSession.participants.guests.push(hostAgentParticipant);
        console.log('✅ [UnifiedGuestChat] Added host agent to participants.guests');
      } else {
        console.log('🔗 [UnifiedGuestChat] Host agent already in participants or missing agent info');
      }
      
      // Also check for any other AI agents mentioned in messages that might not be in participants
      await this.discoverAdditionalAIAgents(chatSession);
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error ensuring host agent in participants:', error);
    }
  }

  /**
   * Discover additional AI agents from message history that might not be in participants
   */
  private async discoverAdditionalAIAgents(chatSession: ChatSession): Promise<void> {
    try {
      console.log('🔍 [UnifiedGuestChat] Discovering additional AI agents from messages');
      
      // Look for messages with agent metadata that might indicate other AI participants
      const agentMessages = chatSession.messages?.filter(m => 
        m.sender === 'assistant' && m.metadata?.agentId && m.metadata?.agentName
      ) || [];
      
      const discoveredAgents = new Map<string, { id: string; name: string }>();
      
      agentMessages.forEach(msg => {
        if (msg.metadata?.agentId && msg.metadata?.agentName) {
          discoveredAgents.set(msg.metadata.agentId, {
            id: msg.metadata.agentId,
            name: msg.metadata.agentName
          });
        }
      });
      
      // Add any discovered agents that aren't already in participants
      const existingAgentIds = new Set([
        ...(chatSession.participants?.guests?.filter(g => g.type === 'ai_agent').map(g => g.id) || []),
        chatSession.agentId
      ]);
      
      for (const [agentId, agentInfo] of discoveredAgents) {
        if (!existingAgentIds.has(agentId)) {
          console.log('🔧 [UnifiedGuestChat] Adding discovered AI agent to participants:', agentInfo);
          
          const agentParticipant = {
            id: agentInfo.id,
            name: agentInfo.name,
            type: 'ai_agent' as const,
            joinedAt: chatSession.createdAt,
            lastActive: chatSession.lastUpdated,
            messageCount: agentMessages.filter(m => m.metadata?.agentId === agentId).length,
            status: 'active' as const
          };
          
          chatSession.participants.guests.push(agentParticipant);
          console.log('✅ [UnifiedGuestChat] Added discovered AI agent to participants');
        }
      }
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error discovering additional AI agents:', error);
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
      await chatHistoryService.addMessageToSession(conversationId, {
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
      
      // 🚀 NEW: Trigger real-time update on host side
      this.triggerHostSessionRefresh(conversationId);
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error sending message to host conversation:', error);
      throw error;
    }
  }

  /**
   * Enrich agent names with proper names from chatbot profiles and add color/host user data
   */
  private async enrichAgentNames(chatSession: ChatSession): Promise<void> {
    try {
      console.log('✨ [UnifiedGuestChat] Enriching agent names and data in chat session');
      
      // Enrich main agent name
      if (chatSession.agentId && chatSession.agentName) {
        const properName = await this.getProperAgentName(chatSession.agentId);
        if (properName && properName !== chatSession.agentName) {
          console.log('✨ [UnifiedGuestChat] Enriching main agent name:', {
            agentId: chatSession.agentId,
            oldName: chatSession.agentName,
            newName: properName
          });
          chatSession.agentName = properName;
          console.log('✅ [UnifiedGuestChat] Updated chatSession.agentName to:', chatSession.agentName);
        }
      }
      
      // Enrich agent names and colors in participants.guests
      if (chatSession.participants?.guests) {
        for (const guest of chatSession.participants.guests) {
          if (guest.type === 'ai_agent' && guest.id) {
            const properName = await this.getProperAgentName(guest.id);
            const agentColor = this.getAgentColor(guest.id, properName);
            
            if (properName && properName !== guest.name) {
              console.log('✨ [UnifiedGuestChat] Enriching participant agent name:', {
                agentId: guest.id,
                oldName: guest.name,
                newName: properName,
                color: agentColor
              });
              guest.name = properName;
              // Add color to participant metadata
              if (!guest.metadata) guest.metadata = {};
              guest.metadata.color = agentColor;
              console.log('✅ [UnifiedGuestChat] Updated participant name and color:', { name: guest.name, color: agentColor });
            }
          }
        }
      }
      
      // Enrich host user data
      await this.enrichHostUserData(chatSession);
      
      console.log('✅ [UnifiedGuestChat] Agent name and data enrichment completed');
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error enriching agent names:', error);
    }
  }

  /**
   * Enrich host user data with proper name from host chat session
   */
  private async enrichHostUserData(chatSession: ChatSession): Promise<void> {
    try {
      console.log('✨ [UnifiedGuestChat] Enriching host user data');
      
      if (chatSession.participants?.host) {
        // Try to get host user name from various sources
        let hostUserName = chatSession.participants.host.name;
        
        // If host name is generic, try to get from user data or messages
        if (!hostUserName || hostUserName === 'Host User' || hostUserName === 'User') {
          // Look for user messages to get the actual user name
          const userMessages = chatSession.messages?.filter(m => 
            m.sender === 'user' && m.metadata?.userName
          ) || [];
          
          if (userMessages.length > 0) {
            const userName = userMessages[0].metadata?.userName;
            if (userName && userName !== 'User') {
              hostUserName = userName;
              console.log('✨ [UnifiedGuestChat] Found host user name from messages:', userName);
            }
          }
          
          // Update the host participant name
          if (hostUserName && hostUserName !== chatSession.participants.host.name) {
            console.log('✨ [UnifiedGuestChat] Updating host user name:', {
              oldName: chatSession.participants.host.name,
              newName: hostUserName
            });
            chatSession.participants.host.name = hostUserName;
            console.log('✅ [UnifiedGuestChat] Updated host user name to:', hostUserName);
          }
        }
      }
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error enriching host user data:', error);
    }
  }

  /**
   * Get agent color based on host chat color system
   */
  private getAgentColor(agentId: string, agentName?: string): string {
    // Use the same color palette as the host chat
    const agentColorPalette = [
      '#f97316', // Orange
      '#8b5cf6', // Purple  
      '#10b981', // Green
      '#ec4899', // Pink
      '#eab308', // Yellow
      '#06b6d4', // Cyan
      '#ef4444', // Red
      '#84cc16', // Lime
    ];
    
    // For Claude Assistant, always use orange (first color) to match host chat
    if (agentName === 'Claude Assistant' || agentId.includes('claude') || agentId.includes('chatbot-175')) {
      console.log('🎨 [UnifiedGuestChat] Assigning orange color to Claude Assistant');
      return agentColorPalette[0]; // Orange
    }
    
    // For other agents, use sequential assignment based on agent ID hash
    const agentIndex = this.hashAgentId(agentId) % agentColorPalette.length;
    const color = agentColorPalette[agentIndex];
    
    console.log('🎨 [UnifiedGuestChat] Assigned color to agent:', { agentId, agentName, color, index: agentIndex });
    return color;
  }

  /**
   * Hash agent ID for consistent color assignment
   */
  private hashAgentId(agentId: string): number {
    let hash = 0;
    for (let i = 0; i < agentId.length; i++) {
      const char = agentId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get proper agent name from chatbot ID using various strategies
   */
  private async getProperAgentName(agentId: string): Promise<string> {
    try {
      console.log('🔍 [UnifiedGuestChat] Getting proper agent name for:', agentId);
      
      // Strategy 1: Extract chatbot ID and use common patterns
      const chatbotId = this.extractChatbotId(agentId);
      console.log('🔍 [UnifiedGuestChat] Extracted chatbot ID:', chatbotId);
      
      // Strategy 2: Common agent name patterns based on ID patterns
      if (agentId.includes('chatbot-175')) {
        // This appears to be a Claude Assistant based on the pattern
        console.log('✅ [UnifiedGuestChat] Matched chatbot-175 pattern, returning Claude Assistant');
        return 'Claude Assistant';
      }
      
      // Strategy 3: Try to get from global chatbot profiles if available
      // Note: In guest context, we might not have access to full chatbot profiles
      // but we can try common patterns
      
      // Strategy 4: Fallback patterns
      if (agentId.includes('claude') || agentId.includes('anthropic')) {
        return 'Claude Assistant';
      } else if (agentId.includes('gpt') || agentId.includes('openai')) {
        return 'GPT Assistant';
      } else if (agentId.includes('gemini') || agentId.includes('google')) {
        return 'Gemini Assistant';
      }
      
      // If no pattern matches, return a cleaner version of the ID
      return `AI Agent ${chatbotId.slice(-6)}`;
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error getting proper agent name:', error);
      return agentId; // Fallback to original ID
    }
  }

  /**
   * Extract chatbot ID from various formats
   */
  private extractChatbotId(agentId: string): string {
    // Extract numeric ID from formats like "chatbot-1756857540077"
    const match = agentId.match(/chatbot-(\d+)/);
    return match ? match[1] : agentId;
  }

  /**
   * Subscribe to real-time updates for the host conversation
   */
  subscribeToHostConversation(hostUserId: string, conversationId: string, callback: (messages: Message[]) => void): () => void {
    try {
      console.log('🔍 [UnifiedGuestChat] Setting up real-time listener for host conversation:', {
        hostUserId,
        conversationId
      });
      
      // Use Firebase onSnapshot to listen to the host's chat session document
      const chatSessionRef = doc(db, 'chatSessions', conversationId);
      
      const unsubscribe = onSnapshot(chatSessionRef, async (docSnapshot) => {
        if (docSnapshot.exists()) {
          console.log('🔄 [UnifiedGuestChat] Host conversation updated via real-time listener');
          
          // Convert Firestore document to ChatSession format
          const data = docSnapshot.data();
          const session: ChatSession = {
            id: docSnapshot.id,
            name: data.name || 'Shared Conversation',
            agentId: data.agentId || '',
            agentName: data.agentName || 'AI Assistant',
            agentAvatar: data.agentAvatar,
            userId: data.userId || hostUserId,
            messages: data.messages || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            messageCount: data.messageCount || 0,
            isShared: data.isShared || false,
            shareableId: data.shareableId,
            participants: data.participants || { host: null, guests: [] },
            governanceMetrics: data.governanceMetrics || {
              overallTrustScore: 100,
              totalViolations: 0,
              averageResponseTime: 0,
              sessionIntegrity: true
            },
            metadata: data.metadata || {
              tags: [],
              keyTopics: [],
              lastActivity: new Date(),
              isMultiAgent: false
            }
          };
          
          // Ensure host agent is in participants and discover additional agents
          await this.ensureHostAgentInParticipants(session);
          await this.discoverAdditionalAIAgents(session);
          
          callback(session);
        } else {
          console.log('🔄 [UnifiedGuestChat] Host conversation document does not exist');
          callback(null);
        }
      }, (error) => {
        console.error('❌ [UnifiedGuestChat] Error in real-time listener:', error);
        callback(null);
      });
      
      console.log('✅ [UnifiedGuestChat] Real-time listener established');
      return unsubscribe;
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error setting up real-time listener:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Trigger real-time session refresh on host side
   */
  private triggerHostSessionRefresh(sessionId: string): void {
    try {
      console.log('🔄 [UnifiedGuestChat] Triggering host session refresh for:', sessionId);
      
      // Dispatch custom event to trigger session refresh on host side
      const refreshEvent = new CustomEvent('refreshChatSession', {
        detail: { sessionId }
      });
      
      window.dispatchEvent(refreshEvent);
      console.log('✅ [UnifiedGuestChat] Host session refresh event dispatched');
      
    } catch (error) {
      console.error('❌ [UnifiedGuestChat] Error triggering host session refresh:', error);
    }
  }
}

export default UnifiedGuestChatService;

