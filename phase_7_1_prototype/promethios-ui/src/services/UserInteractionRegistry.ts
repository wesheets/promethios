/**
 * User Interaction Registry Service
 * 
 * Manages user interactions like connection requests, collaboration invitations,
 * chat invitations, and other social features using Firebase Firestore.
 */

import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

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

class UserInteractionRegistry {
  private static instance: UserInteractionRegistry;
  private readonly INTERACTIONS_COLLECTION = 'userInteractions';
  private readonly NOTIFICATIONS_COLLECTION = 'interactionNotifications';
  private readonly USERS_COLLECTION = 'userProfiles';
  private readonly COOLDOWN_MINUTES = 5; // Minimum time between same invitations

  static getInstance(): UserInteractionRegistry {
    if (!UserInteractionRegistry.instance) {
      UserInteractionRegistry.instance = new UserInteractionRegistry();
    }
    return UserInteractionRegistry.instance;
  }

  /**
   * Send any type of interaction request with duplicate prevention and cooldown
   */
  async sendInteraction(
    type: InteractionType,
    fromUserId: string,
    toUserId: string,
    metadata: InteractionMetadata
  ): Promise<{ success: boolean; interactionId?: string; error?: string }> {
    try {
      console.log(`🔗 [UserRegistry] Sending ${type} from ${fromUserId} to ${toUserId}`);
      console.log(`🔗 [UserRegistry] Metadata:`, metadata);

      // Check for recent duplicate interactions (cooldown)
      const recentInteraction = await this.checkRecentInteraction(type, fromUserId, toUserId);
      if (recentInteraction) {
        const timeLeft = Math.ceil((recentInteraction.createdAt.toMillis() + (this.COOLDOWN_MINUTES * 60 * 1000) - Date.now()) / 60000);
        return { 
          success: false, 
          error: `Please wait ${timeLeft} more minute(s) before sending another ${type.replace('_', ' ')}`
        };
      }

      // Get user information
      const [fromUserDoc, toUserDoc] = await Promise.all([
        getDoc(doc(db, this.USERS_COLLECTION, fromUserId)),
        getDoc(doc(db, this.USERS_COLLECTION, toUserId))
      ]);

      const fromUser = fromUserDoc.exists() ? fromUserDoc.data() : null;
      const toUser = toUserDoc.exists() ? toUserDoc.data() : null;

      if (!fromUser || !toUser) {
        console.error('❌ [UserRegistry] User information not found:', { fromUser: !!fromUser, toUser: !!toUser });
        return { success: false, error: 'User information not found' };
      }

      console.log('✅ [UserRegistry] User information retrieved:', {
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

      console.log('🔗 [UserRegistry] Interaction object created:', {
        id: interactionId,
        type: interaction.type,
        fromUser: interaction.fromUserName,
        toUser: interaction.toUserName,
        status: interaction.status
      });

      // Save interaction
      console.log('🔗 [UserRegistry] Saving interaction to Firestore...');
      await setDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), interaction);
      console.log('✅ [UserRegistry] Interaction saved to Firestore');

      // Create notification for recipient
      console.log('🔗 [UserRegistry] Creating notification for recipient...');
      const notificationData = {
        userId: toUserId,
        interactionId,
        type,
        title: this.getNotificationTitle(type),
        message: this.getNotificationMessage(type, fromUser.displayName || fromUser.email, metadata),
        actionUrl: this.getActionUrl(type, interactionId, metadata)
      };
      
      console.log('🔗 [UserRegistry] Notification data prepared:', notificationData);
      
      await this.createNotification(notificationData);
      console.log('✅ [UserRegistry] Notification created');

      console.log(`✅ [UserRegistry] ${type} sent successfully: ${interactionId}`);
      return { success: true, interactionId };

    } catch (error) {
      console.error(`❌ [UserRegistry] Error sending ${type}:`, error);
      return { success: false, error: `Failed to send ${type}: ${error.message}` };
    }
  }

  /**
   * Check for recent interactions to implement cooldown
   */
  private async checkRecentInteraction(
    type: InteractionType,
    fromUserId: string,
    toUserId: string
  ): Promise<UserInteraction | null> {
    try {
      const cutoffTime = new Date(Date.now() - (this.COOLDOWN_MINUTES * 60 * 1000));
      const cutoffTimestamp = Timestamp.fromDate(cutoffTime);

      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('type', '==', type),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('createdAt', '>', cutoffTimestamp),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as UserInteraction;
      }

      return null;
    } catch (error) {
      console.error('❌ [UserRegistry] Error checking recent interactions:', error);
      return null; // Allow the interaction if we can't check
    }
  }

  /**
   * Update interaction status (for internal use)
   */
  private async updateInteractionStatus(
    interactionId: string,
    status: InteractionStatus
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔄 [UserRegistry] Updating interaction ${interactionId} status to: ${status}`);

      await updateDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), {
        status,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ [UserRegistry] Interaction status updated: ${interactionId} -> ${status}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [UserRegistry] Error updating interaction status:`, error);
      return { success: false, error: 'Failed to update interaction status' };
    }
  }

  private async createNotification(notification: Omit<InteractionNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
    try {
      const notificationId = `${notification.userId}_${Date.now()}`;
      console.log('🔔 [UserRegistry] Creating notification:', {
        id: notificationId,
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        interactionId: notification.interactionId,
        actionUrl: notification.actionUrl
      });
      
      const notificationData = {
        ...notification,
        read: false,
        createdAt: Timestamp.now()
      };
      
      await setDoc(doc(db, this.NOTIFICATIONS_COLLECTION, notificationId), notificationData);
      console.log('✅ [UserRegistry] Notification created successfully:', notificationId);
      
    } catch (error) {
      console.error('❌ [UserRegistry] Error creating notification:', error);
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

  /**
   * Subscribe to real-time interactions for a user
   */
  subscribeToInteractions(
    userId: string,
    callback: (interactions: UserInteraction[]) => void
  ): () => void {
    console.log(`🔗 [UserRegistry] Setting up real-time subscription for interactions: ${userId}`);

    const q = query(
      collection(db, this.INTERACTIONS_COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const interactions: UserInteraction[] = [];
      querySnapshot.forEach((doc) => {
        interactions.push({ id: doc.id, ...doc.data() } as UserInteraction);
      });
      
      console.log(`🔗 [UserRegistry] Real-time update: ${interactions.length} pending interactions`);
      callback(interactions);
    }, (error) => {
      console.error('❌ [UserRegistry] Error in interactions subscription:', error);
      callback([]); // Return empty array on error
    });

    return unsubscribe;
  }

  /**
   * Subscribe to real-time relationships for a user
   */
  subscribeToRelationships(
    userId: string,
    callback: (relationships: UserRelationship[]) => void
  ): () => void {
    console.log(`🔗 [UserRegistry] Setting up real-time subscription for relationships: ${userId}`);

    const q = query(
      collection(db, this.RELATIONSHIPS_COLLECTION),
      where('participants', 'array-contains', userId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const relationships: UserRelationship[] = [];
      querySnapshot.forEach((doc) => {
        relationships.push({ id: doc.id, ...doc.data() } as UserRelationship);
      });
      
      console.log(`🔗 [UserRegistry] Real-time update: ${relationships.length} active relationships`);
      callback(relationships);
    }, (error) => {
      console.error('❌ [UserRegistry] Error in relationships subscription:', error);
      callback([]); // Return empty array on error
    });

    return unsubscribe;
  }

  /**
   * Get pending interactions for a user
   */
  async getPendingInteractions(userId: string): Promise<UserInteraction[]> {
    try {
      console.log(`📥 [UserRegistry] Getting pending interactions for: ${userId}`);

      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const interactions: UserInteraction[] = [];
      
      querySnapshot.forEach((doc) => {
        interactions.push({ id: doc.id, ...doc.data() } as UserInteraction);
      });

      console.log(`📥 [UserRegistry] Found ${interactions.length} pending interactions`);
      return interactions;
    } catch (error) {
      console.error('❌ [UserRegistry] Error getting pending interactions:', error);
      return [];
    }
  }

  /**
   * Get relationships for a user
   */
  async getRelationships(userId: string): Promise<UserRelationship[]> {
    try {
      console.log(`🤝 [UserRegistry] Getting relationships for: ${userId}`);

      const q = query(
        collection(db, this.RELATIONSHIPS_COLLECTION),
        where('participants', 'array-contains', userId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const relationships: UserRelationship[] = [];
      
      querySnapshot.forEach((doc) => {
        relationships.push({ id: doc.id, ...doc.data() } as UserRelationship);
      });

      console.log(`🤝 [UserRegistry] Found ${relationships.length} active relationships`);
      return relationships;
    } catch (error) {
      console.error('❌ [UserRegistry] Error getting relationships:', error);
      return [];
    }
  }
}

export const userInteractionRegistry = UserInteractionRegistry.getInstance();
export { UserInteractionRegistry };
export default userInteractionRegistry;

