/**
 * Unified Notification Service
 * 
 * Provides a standardized interface for all notification types across the application.
 * All notifications flow through the UserInteractionRegistry for consistency and scalability.
 */

import { userInteractionRegistry, InteractionType, InteractionMetadata } from './UserInteractionRegistry';

export type UnifiedNotificationType = 
  // Social & Connection
  | 'connection_request'
  | 'collaboration_invitation'
  | 'chat_invitation'
  | 'meeting_request'
  | 'file_share_request'
  | 'team_invitation'
  | 'project_invitation'
  
  // Social Feed Notifications
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'post_mention'
  | 'comment_reply'
  | 'collaboration_highlight_shared'
  | 'ai_showcase_featured'
  
  // Trust & Verification
  | 'trust_attestation'
  | 'verification_update'
  | 'reputation_change'
  | 'skill_endorsement'
  
  // System & Workflow
  | 'conversation_update'
  | 'agent_deployment'
  | 'system_alert'
  | 'workflow_update'
  
  // Business & Marketplace
  | 'marketplace_transaction'
  | 'professional_endorsement'
  | 'business_proposal'
  | 'payment_update';

export interface UnifiedNotificationRequest {
  type: UnifiedNotificationType;
  fromUserId: string;
  toUserId: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

class UnifiedNotificationService {
  private static instance: UnifiedNotificationService;

  static getInstance(): UnifiedNotificationService {
    if (!UnifiedNotificationService.instance) {
      UnifiedNotificationService.instance = new UnifiedNotificationService();
    }
    return UnifiedNotificationService.instance;
  }

  /**
   * Send any type of notification through the unified system
   */
  async sendNotification(request: UnifiedNotificationRequest): Promise<NotificationResponse> {
    try {
      console.log(`🔔 [UnifiedNotification] Sending ${request.type} from ${request.fromUserId} to ${request.toUserId}`);

      // Map unified types to UserInteractionRegistry types
      const interactionType = this.mapToInteractionType(request.type);
      
      // Prepare metadata
      const metadata: InteractionMetadata = {
        message: request.message,
        priority: request.priority || 'medium',
        ...request.metadata
      };

      // Send through UserInteractionRegistry
      const result = await userInteractionRegistry.sendInteraction(
        interactionType,
        request.fromUserId,
        request.toUserId,
        metadata
      );

      if (result.success) {
        console.log(`✅ [UnifiedNotification] ${request.type} sent successfully: ${result.interactionId}`);
        return {
          success: true,
          notificationId: result.interactionId
        };
      } else {
        console.error(`❌ [UnifiedNotification] Failed to send ${request.type}: ${result.error}`);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error(`❌ [UnifiedNotification] Error sending ${request.type}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send social feed notification (likes, comments, shares)
   */
  async sendSocialNotification(
    type: 'post_like' | 'post_comment' | 'post_share' | 'post_mention' | 'comment_reply',
    fromUserId: string,
    toUserId: string,
    postId: string,
    postTitle: string,
    additionalData?: Record<string, any>
  ): Promise<NotificationResponse> {
    const notificationMessages = {
      post_like: `liked your post: "${postTitle}"`,
      post_comment: `commented on your post: "${postTitle}"`,
      post_share: `shared your post: "${postTitle}"`,
      post_mention: `mentioned you in a post: "${postTitle}"`,
      comment_reply: `replied to your comment on: "${postTitle}"`
    };

    const priorities = {
      post_like: 'low' as const,
      post_comment: 'medium' as const,
      post_share: 'medium' as const,
      post_mention: 'high' as const,
      comment_reply: 'medium' as const
    };

    return this.sendNotification({
      type,
      fromUserId,
      toUserId,
      title: `New ${type.replace('_', ' ')}`,
      message: notificationMessages[type],
      metadata: {
        postId,
        postTitle,
        ...additionalData
      },
      priority: priorities[type]
    });
  }

  /**
   * Map unified notification types to UserInteractionRegistry types
   */
  private mapToInteractionType(type: UnifiedNotificationType): InteractionType {
    // Map social notifications to existing interaction types
    // Note: UserInteractionRegistry may need to be extended for social types
    switch (type) {
      case 'post_like':
      case 'post_comment':
      case 'post_share':
      case 'post_mention':
      case 'comment_reply':
      case 'collaboration_highlight_shared':
      case 'ai_showcase_featured':
        return 'connection_request'; // Temporary mapping - should be extended
      
      case 'connection_request':
        return 'connection_request';
      case 'collaboration_invitation':
        return 'collaboration_invitation';
      case 'chat_invitation':
        return 'chat_invitation';
      case 'meeting_request':
        return 'meeting_request';
      case 'file_share_request':
        return 'file_share_request';
      case 'team_invitation':
        return 'team_invitation';
      case 'project_invitation':
        return 'project_invitation';
      
      default:
        console.warn(`⚠️ [UnifiedNotification] Unknown notification type: ${type}, defaulting to connection_request`);
        return 'connection_request';
    }
  }

  /**
   * Send collaboration invitation notification
   */
  async sendCollaborationInvitation(
    fromUserId: string,
    toUserId: string,
    conversationId: string,
    conversationName: string,
    agentName?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'collaboration_invitation',
      fromUserId,
      toUserId,
      title: 'AI Collaboration Invitation',
      message: `invited you to collaborate on: "${conversationName}"`,
      metadata: {
        conversationId,
        conversationName,
        agentName,
        sessionType: 'ai_collaboration'
      },
      priority: 'high'
    });
  }

  /**
   * Send chat invitation notification
   */
  async sendChatInvitation(
    fromUserId: string,
    toUserId: string,
    conversationId: string,
    conversationName: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'chat_invitation',
      fromUserId,
      toUserId,
      title: 'Chat Invitation',
      message: `invited you to join: "${conversationName}"`,
      metadata: {
        conversationId,
        conversationName,
        sessionType: 'human_chat'
      },
      priority: 'medium'
    });
  }

  /**
   * Send connection request notification
   */
  async sendConnectionRequest(
    fromUserId: string,
    toUserId: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'connection_request',
      fromUserId,
      toUserId,
      title: 'Connection Request',
      message: message || 'wants to connect with you',
      priority: 'medium'
    });
  }

  /**
   * Batch send notifications (for bulk operations)
   */
  async sendBatchNotifications(requests: UnifiedNotificationRequest[]): Promise<NotificationResponse[]> {
    const results = await Promise.allSettled(
      requests.map(request => this.sendNotification(request))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: 'Batch notification failed' }
    );
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
  }> {
    try {
      // This would typically query the database for notification counts
      // For now, return mock data
      return {
        total: 0,
        unread: 0,
        byType: {}
      };
    } catch (error) {
      console.error('❌ [UnifiedNotification] Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {}
      };
    }
  }
}

export { UnifiedNotificationService };
export const unifiedNotificationService = UnifiedNotificationService.getInstance();

