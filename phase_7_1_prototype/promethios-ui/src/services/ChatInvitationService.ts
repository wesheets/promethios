/**
 * AI Collaboration Invitation Service (Unified)
 * 
 * Now uses the UserInteractionRegistry for consistent experience
 * Acts as a wrapper around the unified notification system
 */

import { userInteractionRegistry, InteractionMetadata } from './UserInteractionRegistry';
import { ConnectionService } from './ConnectionService';
import SharedConversationService from './SharedConversationService';

export interface AICollaborationInvitationRequest {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  conversationId: string;
  conversationName: string;
  agentName?: string;
  message?: string;
}

export interface CollaborationInvitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  toUserName: string;
  toUserPhoto?: string;
  conversationId: string;
  conversationName: string;
  agentName?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
  updatedAt: any;
}

class ChatInvitationService {
  private static instance: ChatInvitationService;
  private connectionService: ConnectionService;
  private sharedConversationService: SharedConversationService;

  constructor() {
    this.connectionService = ConnectionService.getInstance();
    this.sharedConversationService = SharedConversationService.getInstance();
  }

  static getInstance(): ChatInvitationService {
    if (!ChatInvitationService.instance) {
      ChatInvitationService.instance = new ChatInvitationService();
    }
    return ChatInvitationService.instance;
  }

  /**
   * Send collaboration invitation using unified registry
   */
  async sendCollaborationInvitation(request: AICollaborationInvitationRequest): Promise<{
    success: boolean;
    invitationId?: string;
    error?: string;
  }> {
    try {
      console.log('🤖 [ChatInvitationService] Sending collaboration invitation via unified registry');

      // Validate connection between users
      const isConnected = await this.connectionService.areUsersConnected(
        request.fromUserId, 
        request.toUserId
      );

      if (!isConnected) {
        return {
          success: false,
          error: 'Users must be connected to send collaboration invitations'
        };
      }

      // Prepare metadata for the unified registry
      const metadata: InteractionMetadata = {
        conversationId: request.conversationId,
        conversationName: request.conversationName,
        agentName: request.agentName,
        message: request.message,
        sessionType: 'ai_collaboration',
        priority: 'medium'
      };

      // Send invitation through unified registry
      const result = await userInteractionRegistry.sendInteraction(
        'collaboration_invitation',
        request.fromUserId,
        request.toUserId,
        metadata
      );

      if (result.success) {
        console.log('✅ [ChatInvitationService] Collaboration invitation sent successfully');
        
        // Add pending participant to host's conversation (unified approach)
        console.log('🔄 [ChatInvitationService] Adding pending participant to host conversation...');
        try {
          // Instead of creating a separate shared conversation, add the invited user
          // as a pending participant to the host's existing chat context
          await this.addPendingParticipantToHostConversation({
            hostUserId: request.fromUserId,
            conversationId: request.conversationId,
            participantId: request.toUserId,
            participantName: request.toUserName,
            invitationId: result.interactionId!
          });
          
          console.log('✅ [ChatInvitationService] Pending participant added to host conversation');
          
        } catch (participantError) {
          console.error('❌ [ChatInvitationService] Failed to add pending participant:', participantError);
          // Don't fail the invitation if shared conversation creation fails
          // The invitation can still be sent, and we can retry conversation creation later
        }
        
        return {
          success: true,
          invitationId: result.interactionId
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send invitation'
        };
      }

    } catch (error) {
      console.error('❌ [ChatInvitationService] Error sending invitation:', error);
      return {
        success: false,
        error: 'Failed to send collaboration invitation'
      };
    }
  }

  /**
   * Backward compatibility method - delegates to sendCollaborationInvitation
   */
  async createChatInvitation(request: AICollaborationInvitationRequest): Promise<{
    success: boolean;
    invitationId?: string;
    error?: string;
  }> {
    console.log('🔄 [ChatInvitationService] createChatInvitation called - delegating to sendCollaborationInvitation');
    return this.sendCollaborationInvitation(request);
  }

  /**
   * Accept collaboration invitation using unified registry
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🤖 [ChatInvitationService] Accepting invitation via unified registry');

      const result = await userInteractionRegistry.respondToInteraction(
        invitationId,
        userId,
        'accepted'
      );

      if (result.success) {
        console.log('✅ [ChatInvitationService] Invitation accepted successfully');
        
        // Get the interaction to access conversation details
        const interaction = await userInteractionRegistry.getInteraction(invitationId);
        if (interaction?.metadata.conversationId) {
          // Activate pending participant in host's conversation (unified approach)
          await this.activateParticipantInHostConversation(
            interaction.fromUserId, // Host user ID
            interaction.metadata.conversationId,
            userId // Participant who accepted
          );
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to accept invitation'
        };
      }

    } catch (error) {
      console.error('❌ [ChatInvitationService] Error accepting invitation:', error);
      return {
        success: false,
        error: 'Failed to accept invitation'
      };
    }
  }

  /**
   * Decline collaboration invitation using unified registry
   */
  async declineInvitation(invitationId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🤖 [ChatInvitationService] Declining invitation via unified registry');

      const result = await userInteractionRegistry.respondToInteraction(
        invitationId,
        userId,
        'declined'
      );

      if (result.success) {
        console.log('✅ [ChatInvitationService] Invitation declined successfully');
        
        // Get the interaction to access conversation details
        const interaction = await userInteractionRegistry.getInteraction(invitationId);
        if (interaction?.metadata.conversationId) {
          // Remove user from shared conversation
          await this.sharedConversationService.removeUserFromConversation(
            interaction.metadata.conversationId,
            userId
          );
        }

        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to decline invitation'
        };
      }

    } catch (error) {
      console.error('❌ [ChatInvitationService] Error declining invitation:', error);
      return {
        success: false,
        error: 'Failed to decline invitation'
      };
    }
  }

  /**
   * Get pending invitations for a user (legacy compatibility)
   * Now uses unified registry
   */
  async getPendingInvitations(userId: string): Promise<CollaborationInvitation[]> {
    try {
      console.log('🤖 [ChatInvitationService] Getting pending invitations via unified registry');

      const interactions = await userInteractionRegistry.getPendingInteractions(userId);
      
      // Filter for collaboration invitations and convert to legacy format
      const collaborationInvitations = interactions
        .filter(interaction => interaction.type === 'collaboration_invitation')
        .map(interaction => ({
          id: interaction.id,
          fromUserId: interaction.fromUserId,
          fromUserName: interaction.fromUserName,
          fromUserPhoto: interaction.fromUserPhoto,
          toUserId: interaction.toUserId,
          toUserName: interaction.toUserName,
          toUserPhoto: interaction.toUserPhoto,
          conversationId: interaction.metadata.conversationId || '',
          conversationName: interaction.metadata.conversationName || '',
          agentName: interaction.metadata.agentName,
          message: interaction.metadata.message,
          status: interaction.status as 'pending' | 'accepted' | 'declined',
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt
        }));

      console.log(`🤖 [ChatInvitationService] Found ${collaborationInvitations.length} pending invitations`);
      return collaborationInvitations;

    } catch (error) {
      console.error('❌ [ChatInvitationService] Error getting pending invitations:', error);
      return [];
    }
  }

  /**
   * Subscribe to invitation changes (legacy compatibility)
   * Now uses unified registry
   */
  subscribeToInvitations(
    userId: string,
    callback: (invitations: CollaborationInvitation[]) => void
  ): () => void {
    console.log('🤖 [ChatInvitationService] Setting up invitation subscription via unified registry');

    return userInteractionRegistry.subscribeToInteractions(userId, (interactions) => {
      // Filter for collaboration invitations and convert to legacy format
      const collaborationInvitations = interactions
        .filter(interaction => interaction.type === 'collaboration_invitation')
        .map(interaction => ({
          id: interaction.id,
          fromUserId: interaction.fromUserId,
          fromUserName: interaction.fromUserName,
          fromUserPhoto: interaction.fromUserPhoto,
          toUserId: interaction.toUserId,
          toUserName: interaction.toUserName,
          toUserPhoto: interaction.toUserPhoto,
          conversationId: interaction.metadata.conversationId || '',
          conversationName: interaction.metadata.conversationName || '',
          agentName: interaction.metadata.agentName,
          message: interaction.metadata.message,
          status: interaction.status as 'pending' | 'accepted' | 'declined',
          createdAt: interaction.createdAt,
          updatedAt: interaction.updatedAt
        }));

      callback(collaborationInvitations);
    });
  }

  /**
   * Send invitation to multiple users
   */
  async sendInvitationToMultipleUsers(
    fromUserId: string,
    fromUserName: string,
    userIds: string[],
    conversationId: string,
    conversationName: string,
    agentName?: string,
    message?: string
  ): Promise<{
    success: boolean;
    successfulInvitations: string[];
    failedInvitations: { userId: string; error: string }[];
  }> {
    console.log(`🤖 [ChatInvitationService] Sending invitations to ${userIds.length} users`);

    const successfulInvitations: string[] = [];
    const failedInvitations: { userId: string; error: string }[] = [];

    for (const toUserId of userIds) {
      try {
        // Get user info for the invitation
        const userInfo = await userInteractionRegistry.getUserInfo(toUserId);
        
        if (!userInfo) {
          failedInvitations.push({
            userId: toUserId,
            error: 'User not found'
          });
          continue;
        }

        const result = await this.sendCollaborationInvitation({
          fromUserId,
          fromUserName,
          toUserId,
          toUserName: userInfo.displayName || userInfo.email || 'Unknown User',
          conversationId,
          conversationName,
          agentName,
          message
        });

        if (result.success) {
          successfulInvitations.push(toUserId);
        } else {
          failedInvitations.push({
            userId: toUserId,
            error: result.error || 'Unknown error'
          });
        }

      } catch (error) {
        failedInvitations.push({
          userId: toUserId,
          error: 'Failed to send invitation'
        });
      }
    }

    return {
      success: successfulInvitations.length > 0,
      successfulInvitations,
      failedInvitations
    };
  }

  /**
   * Add pending participant to host's conversation (unified approach)
   */
  private async addPendingParticipantToHostConversation(params: {
    hostUserId: string;
    conversationId: string;
    participantId: string;
    participantName: string;
    invitationId: string;
  }): Promise<void> {
    try {
      console.log('🔄 [ChatInvitationService] Adding pending participant to host conversation:', params);
      
      // Import Firebase functions
      const { doc, updateDoc, arrayUnion, getDoc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Create participant object
      const participant = {
        id: params.participantId,
        name: params.participantName,
        avatar: '', // Can be populated later
        type: 'human' as const,
        status: 'pending' as const,
        addedAt: new Date(),
        addedBy: params.hostUserId,
        invitationId: params.invitationId
      };
      
      // Store in a host-specific document that the main chat component can listen to
      const hostParticipantsRef = doc(db, 'host_participants', params.hostUserId);
      const hostDoc = await getDoc(hostParticipantsRef);
      
      if (hostDoc.exists()) {
        // Update existing document
        await updateDoc(hostParticipantsRef, {
          [`conversations.${params.conversationId}.guestParticipants`]: arrayUnion(participant)
        });
      } else {
        // Create new document
        await setDoc(hostParticipantsRef, {
          conversations: {
            [params.conversationId]: {
              guestParticipants: [participant]
            }
          }
        });
      }
      
      console.log('✅ [ChatInvitationService] Pending participant added to Firebase');
      
    } catch (error) {
      console.error('❌ [ChatInvitationService] Failed to add pending participant:', error);
      throw error;
    }
  }

  /**
   * Activate participant in host's conversation (unified approach)
   */
  private async activateParticipantInHostConversation(
    hostUserId: string,
    conversationId: string,
    participantId: string
  ): Promise<void> {
    try {
      console.log('🔄 [ChatInvitationService] Activating participant in host conversation:', {
        hostUserId,
        conversationId,
        participantId
      });
      
      // Import Firebase functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Get the host's participants document
      const hostParticipantsRef = doc(db, 'host_participants', hostUserId);
      const hostDoc = await getDoc(hostParticipantsRef);
      
      if (hostDoc.exists()) {
        const data = hostDoc.data();
        const conversationData = data.conversations?.[conversationId];
        
        if (conversationData?.guestParticipants) {
          // Find and update the participant's status
          const updatedParticipants = conversationData.guestParticipants.map((p: any) => {
            if (p.id === participantId) {
              return { ...p, status: 'active', activatedAt: new Date() };
            }
            return p;
          });
          
          // Update the document
          await updateDoc(hostParticipantsRef, {
            [`conversations.${conversationId}.guestParticipants`]: updatedParticipants
          });
          
          console.log('✅ [ChatInvitationService] Participant activated in Firebase');
        }
      }
      
    } catch (error) {
      console.error('❌ [ChatInvitationService] Failed to activate participant:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const chatInvitationService = ChatInvitationService.getInstance();
export default chatInvitationService;

