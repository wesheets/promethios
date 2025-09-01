/**
 * AI Collaboration Invitation Service
 * 
 * Handles sending invitations to connected users to join AI collaboration conversations.
 * Integrates with Firebase connections and the existing notification infrastructure.
 */

import { ConnectionService } from './ConnectionService';
import { notificationService } from './NotificationService';
import { AppNotification } from '../types/notification';

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

export interface AICollaborationInvitationNotification extends AppNotification {
  metadata: {
    invitationType: 'ai_collaboration_invitation';
    fromUserId: string;
    fromUserName: string;
    conversationId: string;
    conversationName: string;
    agentName?: string;
    invitationId: string;
  };
}

class AICollaborationInvitationService {
  private static instance: AICollaborationInvitationService;
  private connectionService: ConnectionService;

  private constructor() {
    this.connectionService = ConnectionService.getInstance();
  }

  static getInstance(): AICollaborationInvitationService {
    if (!AICollaborationInvitationService.instance) {
      AICollaborationInvitationService.instance = new AICollaborationInvitationService();
    }
    return AICollaborationInvitationService.instance;
  }

  /**
   * Send an AI collaboration invitation to a connected user
   */
  async sendCollaborationInvitation(invitation: AICollaborationInvitationRequest): Promise<void> {
    try {
      console.log(`🤖 [AICollaboration] Sending invitation from ${invitation.fromUserName} to ${invitation.toUserName}`);

      // Verify users are connected
      const areConnected = await this.connectionService.areUsersConnected(
        invitation.fromUserId, 
        invitation.toUserId
      );

      if (!areConnected) {
        throw new Error('Users must be connected to send collaboration invitations');
      }

      // Create unique invitation ID
      const invitationId = `ai_collab_invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create notification for the recipient
      const notification: AICollaborationInvitationNotification = {
        id: invitationId,
        type: 'info',
        title: 'AI Collaboration Invitation',
        message: `${invitation.fromUserName} invited you to join AI conversation "${invitation.conversationName}"${invitation.agentName ? ` with ${invitation.agentName}` : ''}`,
        timestamp: new Date().toISOString(),
        read: false,
        priority: 'medium',
        category: 'collaboration',
        actions: [
          {
            label: 'Join Conversation',
            url: `/chat?conversation=${invitation.conversationId}`,
            style: 'primary'
          },
          {
            label: 'Decline',
            handler: () => this.declineInvitation(invitationId),
            style: 'secondary'
          }
        ],
        metadata: {
          invitationType: 'ai_collaboration_invitation',
          fromUserId: invitation.fromUserId,
          fromUserName: invitation.fromUserName,
          conversationId: invitation.conversationId,
          conversationName: invitation.conversationName,
          agentName: invitation.agentName,
          invitationId: invitationId
        }
      };

      // Send notification through the notification service
      notificationService.addNotification(notification);

      console.log(`✅ [AICollaboration] Invitation sent successfully with ID: ${invitationId}`);

      // TODO: In a real implementation, we would also:
      // 1. Store the invitation in Firebase for persistence
      // 2. Send real-time updates to the recipient if they're online
      // 3. Handle invitation expiration

    } catch (error) {
      console.error('❌ [AICollaboration] Error sending invitation:', error);
      throw error;
    }
  }

  /**
   * Send AI collaboration invitations to multiple connected users
   */
  async sendCollaborationInvitations(invitations: AICollaborationInvitationRequest[]): Promise<void> {
    console.log(`🤖 [AICollaboration] Sending ${invitations.length} collaboration invitations`);

    const results = await Promise.allSettled(
      invitations.map(invitation => this.sendCollaborationInvitation(invitation))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`✅ [AICollaboration] Sent ${successful} invitations successfully, ${failed} failed`);

    if (failed > 0) {
      const errors = results
        .filter(result => result.status === 'rejected')
        .map(result => (result as PromiseRejectedResult).reason);
      
      console.error('❌ [AICollaboration] Failed invitations:', errors);
    }
  }

  /**
   * Decline an AI collaboration invitation
   */
  async declineInvitation(invitationId: string): Promise<void> {
    try {
      console.log(`❌ [AICollaboration] Declining invitation: ${invitationId}`);

      // Mark the notification as read and remove it
      await notificationService.markAsRead(invitationId);
      await notificationService.deleteNotification(invitationId);

      // TODO: In a real implementation, we would also:
      // 1. Notify the sender that the invitation was declined
      // 2. Update the invitation status in Firebase

      console.log(`✅ [AICollaboration] Invitation declined successfully`);
    } catch (error) {
      console.error('❌ [AICollaboration] Error declining invitation:', error);
      throw error;
    }
  }

  /**
   * Get all pending AI collaboration invitations for a user
   */
  getPendingInvitations(): AICollaborationInvitationNotification[] {
    const notifications = notificationService.getNotifications({
      category: ['collaboration'],
      unreadOnly: true
    });

    return notifications.filter(notification => 
      notification.metadata?.invitationType === 'ai_collaboration_invitation'
    ) as AICollaborationInvitationNotification[];
  }

  /**
   * Accept an AI collaboration invitation
   */
  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      console.log(`✅ [AICollaboration] Accepting invitation: ${invitationId}`);

      const notifications = notificationService.getNotifications();
      const invitation = notifications.find(n => n.id === invitationId) as AICollaborationInvitationNotification;

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Mark as read and remove the notification
      await notificationService.markAsRead(invitationId);
      await notificationService.deleteNotification(invitationId);

      // Navigate to the AI conversation (this would be handled by the UI component)
      const conversationUrl = `/chat?conversation=${invitation.metadata.conversationId}`;
      console.log(`🔗 [AICollaboration] Redirecting to conversation: ${conversationUrl}`);

      // TODO: In a real implementation, we would also:
      // 1. Add the user to the conversation participants
      // 2. Notify other participants that the user joined
      // 3. Update the conversation membership in Firebase

      console.log(`✅ [AICollaboration] Invitation accepted successfully`);
    } catch (error) {
      console.error('❌ [AICollaboration] Error accepting invitation:', error);
      throw error;
    }
  }
}

export const aiCollaborationInvitationService = AICollaborationInvitationService.getInstance();
export default aiCollaborationInvitationService;

