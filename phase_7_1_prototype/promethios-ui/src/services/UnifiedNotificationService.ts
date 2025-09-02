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
        error: `Failed to send ${request.type}`
      };
    }
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
      message: message || "Hi! I'd like to connect and explore collaboration opportunities.",
      priority: 'medium'
    });
  }

  /**
   * Send collaboration invitation
   */
  async sendCollaborationInvitation(
    fromUserId: string,
    toUserId: string,
    conversationId: string,
    conversationName: string,
    agentName: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'collaboration_invitation',
      fromUserId,
      toUserId,
      message: message || `Join me in this AI collaboration session: "${conversationName}" with ${agentName}`,
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
   * Send chat invitation
   */
  async sendChatInvitation(
    fromUserId: string,
    toUserId: string,
    chatId?: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'chat_invitation',
      fromUserId,
      toUserId,
      message: message || "Would you like to join a chat conversation?",
      metadata: {
        chatId
      },
      priority: 'medium'
    });
  }

  /**
   * Send trust attestation notification
   */
  async sendTrustAttestation(
    fromUserId: string,
    toUserId: string,
    attestationType: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'trust_attestation',
      fromUserId,
      toUserId,
      message: message || `You have received a new trust attestation for ${attestationType}`,
      metadata: {
        attestationType
      },
      priority: 'medium'
    });
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(
    toUserId: string,
    alertType: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'system_alert',
      fromUserId: 'system', // Special system user ID
      toUserId,
      message,
      metadata: {
        alertType
      },
      priority
    });
  }

  /**
   * Send team invitation
   */
  async sendTeamInvitation(
    fromUserId: string,
    toUserId: string,
    teamId: string,
    teamName: string,
    role?: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'team_invitation',
      fromUserId,
      toUserId,
      message: message || `You've been invited to join the team "${teamName}"`,
      metadata: {
        teamId,
        teamName,
        role
      },
      priority: 'high'
    });
  }

  /**
   * Send file share request
   */
  async sendFileShareRequest(
    fromUserId: string,
    toUserId: string,
    fileId: string,
    fileName: string,
    message?: string
  ): Promise<NotificationResponse> {
    return this.sendNotification({
      type: 'file_share_request',
      fromUserId,
      toUserId,
      message: message || `${fileName} has been shared with you`,
      metadata: {
        fileId,
        fileName
      },
      priority: 'medium'
    });
  }

  /**
   * Respond to any notification (accept/decline)
   */
  async respondToNotification(
    notificationId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<NotificationResponse> {
    try {
      const result = await userInteractionRegistry.respondToInteraction(
        notificationId,
        userId,
        response
      );

      return {
        success: result.success,
        error: result.error
      };
    } catch (error) {
      console.error('❌ [UnifiedNotification] Error responding to notification:', error);
      return {
        success: false,
        error: 'Failed to respond to notification'
      };
    }
  }

  /**
   * Get pending notifications for a user
   */
  async getPendingNotifications(userId: string, type?: UnifiedNotificationType) {
    const interactionType = type ? this.mapToInteractionType(type) : undefined;
    return userInteractionRegistry.getPendingInteractions(userId, interactionType);
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(
    userId: string,
    callback: (notifications: any[]) => void,
    type?: UnifiedNotificationType
  ) {
    const interactionType = type ? this.mapToInteractionType(type) : undefined;
    return userInteractionRegistry.subscribeToInteractions(userId, callback, interactionType);
  }

  // Private helper methods

  /**
   * Map unified notification types to UserInteractionRegistry types
   */
  private mapToInteractionType(type: UnifiedNotificationType): InteractionType {
    // Most types map directly
    const directMappings: Record<string, InteractionType> = {
      'connection_request': 'connection_request',
      'collaboration_invitation': 'collaboration_invitation',
      'chat_invitation': 'chat_invitation',
      'meeting_request': 'meeting_request',
      'file_share_request': 'file_share_request',
      'team_invitation': 'team_invitation',
      'project_invitation': 'project_invitation'
    };

    if (directMappings[type]) {
      return directMappings[type];
    }

    // For types that don't have direct mappings, we can extend the InteractionType
    // or use a generic type. For now, we'll use connection_request as a fallback
    console.warn(`⚠️ [UnifiedNotification] No direct mapping for type: ${type}, using connection_request`);
    return 'connection_request';
  }
}

export const unifiedNotificationService = UnifiedNotificationService.getInstance();
export default unifiedNotificationService;

