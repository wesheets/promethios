/**
 * Mock User Interaction Registry Service
 * 
 * This is a testing version that uses MockFirebaseService instead of real Firebase
 * to test notification functionality without authentication requirements.
 */

import { Timestamp } from 'firebase/firestore';
import { mockFirebaseService } from './MockFirebaseService';

export type InteractionType = 
  | 'connection_request'
  | 'collaboration_invitation'
  | 'chat_invitation'
  | 'meeting_request'
  | 'file_share_request'
  | 'team_invitation'
  | 'project_invitation';

export type InteractionStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface InteractionMetadata {
  message?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  conversationId?: string;
  conversationName?: string;
  agentName?: string;
  sessionType?: 'ai_collaboration' | 'human_chat' | 'mixed';
  meetingTime?: Timestamp;
  meetingDuration?: number;
  meetingType?: 'video' | 'audio' | 'chat';
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  teamId?: string;
  projectId?: string;
  role?: string;
  permissions?: string[];
}

export interface UserInteraction {
  id: string;
  type: InteractionType;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserPhoto?: string | null;
  toUserName: string;
  toUserPhoto?: string | null;
  status: InteractionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
  metadata: InteractionMetadata;
}

export interface InteractionNotification {
  id: string;
  userId: string;
  interactionId: string;
  type: InteractionType;
  title: string;
  message: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
}

class MockUserInteractionRegistry {
  private static instance: MockUserInteractionRegistry;
  private readonly INTERACTIONS_COLLECTION = 'userInteractions';
  private readonly NOTIFICATIONS_COLLECTION = 'interactionNotifications';
  private readonly USERS_COLLECTION = 'users';

  static getInstance(): MockUserInteractionRegistry {
    if (!MockUserInteractionRegistry.instance) {
      MockUserInteractionRegistry.instance = new MockUserInteractionRegistry();
    }
    return MockUserInteractionRegistry.instance;
  }

  /**
   * Send any type of interaction request
   */
  async sendInteraction(
    type: InteractionType,
    fromUserId: string,
    toUserId: string,
    metadata: InteractionMetadata
  ): Promise<{ success: boolean; interactionId?: string; error?: string }> {
    try {
      console.log(`🔗 [MockUserRegistry] Sending ${type} from ${fromUserId} to ${toUserId}`);
      console.log(`🔗 [MockUserRegistry] Metadata:`, metadata);

      // Get user information
      const [fromUserDoc, toUserDoc] = await Promise.all([
        mockFirebaseService.getDoc(this.USERS_COLLECTION, fromUserId),
        mockFirebaseService.getDoc(this.USERS_COLLECTION, toUserId)
      ]);

      const fromUser = fromUserDoc.exists() ? fromUserDoc.data() : null;
      const toUser = toUserDoc.exists() ? toUserDoc.data() : null;

      if (!fromUser || !toUser) {
        console.error('❌ [MockUserRegistry] User information not found:', { fromUser: !!fromUser, toUser: !!toUser });
        return { success: false, error: 'User information not found' };
      }

      console.log('✅ [MockUserRegistry] User information retrieved:', {
        fromUser: fromUser.displayName || fromUser.email,
        toUser: toUser.displayName || toUser.email
      });

      // Create interaction
      const interactionId = `${type}_${fromUserId}_${toUserId}_${Date.now()}`;
      const interaction: Omit<UserInteraction, 'id'> = {
        type,
        fromUserId,
        toUserId,
        fromUserName: fromUser.displayName || fromUser.email,
        fromUserPhoto: fromUser.photoURL || null,
        toUserName: toUser.displayName || toUser.email,
        toUserPhoto: toUser.photoURL || null,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        expiresAt: this.calculateExpiration(type),
        metadata: {
          ...metadata,
          message: metadata.message || this.getDefaultMessage(type, fromUser.displayName || fromUser.email)
        }
      };

      console.log('🔗 [MockUserRegistry] Interaction object created:', {
        id: interactionId,
        type: interaction.type,
        fromUser: interaction.fromUserName,
        toUser: interaction.toUserName,
        status: interaction.status
      });

      // Save interaction
      console.log('🔗 [MockUserRegistry] Saving interaction to MockFirebase...');
      await mockFirebaseService.setDoc(this.INTERACTIONS_COLLECTION, interactionId, interaction);
      console.log('✅ [MockUserRegistry] Interaction saved to MockFirebase');

      // Create notification for recipient
      console.log('🔗 [MockUserRegistry] Creating notification for recipient...');
      const notificationData = {
        userId: toUserId,
        interactionId,
        type,
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, fromUser.displayName || fromUser.email, metadata),
        actionUrl: this.getActionUrl(type, interactionId, metadata)
      };
      
      console.log('🔗 [MockUserRegistry] Notification data prepared:', notificationData);
      
      await this.createNotification(notificationData);
      console.log('✅ [MockUserRegistry] Notification created');

      console.log(`✅ [MockUserRegistry] ${type} sent successfully: ${interactionId}`);
      return { success: true, interactionId };

    } catch (error) {
      console.error(`❌ [MockUserRegistry] Error sending ${type}:`, error);
      console.error(`❌ [MockUserRegistry] Error details:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return { success: false, error: `Failed to send ${type}: ${error.message}` };
    }
  }

  private async createNotification(notification: Omit<InteractionNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    try {
      const notificationId = `${notification.userId}_${Date.now()}`;
      console.log('🔔 [MockUserRegistry] Creating notification:', {
        id: notificationId,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        interactionId: notification.interactionId,
        actionUrl: notification.actionUrl
      });
      
      // Prepare notification data
      const notificationData = {
        ...notification,
        read: false,
        createdAt: Timestamp.now()
      };
      
      console.log('🔔 [MockUserRegistry] Notification data to write:', notificationData);
      console.log('🔔 [MockUserRegistry] Writing to collection:', this.NOTIFICATIONS_COLLECTION);
      console.log('🔔 [MockUserRegistry] Document ID:', notificationId);
      
      // Write to MockFirebase
      await mockFirebaseService.setDoc(this.NOTIFICATIONS_COLLECTION, notificationId, notificationData);
      
      console.log('✅ [MockUserRegistry] Notification created successfully in MockFirebase:', notificationId);
      
      // Verify the write by reading it back
      try {
        const verifyDoc = await mockFirebaseService.getDoc(this.NOTIFICATIONS_COLLECTION, notificationId);
        if (verifyDoc.exists()) {
          console.log('✅ [MockUserRegistry] Notification verified in MockFirebase:', verifyDoc.data());
        } else {
          console.error('❌ [MockUserRegistry] Notification not found after write - possible write failure');
        }
      } catch (verifyError) {
        console.error('❌ [MockUserRegistry] Error verifying notification write:', verifyError);
      }
      
    } catch (error) {
      console.error('❌ [MockUserRegistry] Error creating notification:', error);
      console.error('❌ [MockUserRegistry] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  private calculateExpiration(type: InteractionType): Timestamp | undefined {
    const now = new Date();
    const expirationHours = {
      'connection_request': 168, // 7 days
      'collaboration_invitation': 24, // 1 day
      'chat_invitation': 24, // 1 day
      'meeting_request': 48, // 2 days
      'file_share_request': 72, // 3 days
      'team_invitation': 168, // 7 days
      'project_invitation': 168 // 7 days
    };

    const hours = expirationHours[type] || 24;
    const expirationTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
    return Timestamp.fromDate(expirationTime);
  }

  private getDefaultMessage(type: InteractionType, fromUserName: string): string {
    const messages = {
      'connection_request': `Hi! I'd like to connect and explore collaboration opportunities.`,
      'collaboration_invitation': `I'd like to invite you to join an AI collaboration session.`,
      'chat_invitation': `Would you like to join a chat conversation?`,
      'meeting_request': `I'd like to schedule a meeting with you.`,
      'file_share_request': `I'd like to share a file with you.`,
      'team_invitation': `You're invited to join our team.`,
      'project_invitation': `You're invited to collaborate on a project.`
    };

    return messages[type] || `${fromUserName} sent you an interaction request.`;
  }

  private getNotificationTitle(type: InteractionType): string {
    const titles = {
      'connection_request': 'Connection Request',
      'collaboration_invitation': 'AI Collaboration Invitation',
      'chat_invitation': 'Chat Invitation',
      'meeting_request': 'Meeting Request',
      'file_share_request': 'File Share Request',
      'team_invitation': 'Team Invitation',
      'project_invitation': 'Project Invitation'
    };

    return titles[type] || 'Interaction Request';
  }

  private getNotificationMessage(type: InteractionType, fromUserName: string, metadata: InteractionMetadata): string {
    switch (type) {
      case 'collaboration_invitation':
        return `${fromUserName} invited you to join AI conversation "${metadata.conversationName}" with ${metadata.agentName}`;
      case 'chat_invitation':
        return `${fromUserName} invited you to join a chat conversation`;
      case 'meeting_request':
        return `${fromUserName} wants to schedule a meeting with you`;
      default:
        return `${fromUserName} sent you a ${type.replace('_', ' ')}`;
    }
  }

  private getActionUrl(type: InteractionType, interactionId: string, metadata: InteractionMetadata): string {
    switch (type) {
      case 'collaboration_invitation':
        return `/chat/${metadata.conversationId}`;
      case 'connection_request':
        return `/profile/${metadata}`;
      default:
        return `/interactions/${interactionId}`;
    }
  }

  // Helper methods for testing
  getStoredNotifications(): any[] {
    return mockFirebaseService.getStoredNotifications();
  }

  getStoredInteractions(): any[] {
    return mockFirebaseService.getStoredInteractions();
  }

  clearAllData(): void {
    mockFirebaseService.clearAll();
  }
}

export const mockUserInteractionRegistry = MockUserInteractionRegistry.getInstance();
export default mockUserInteractionRegistry;

