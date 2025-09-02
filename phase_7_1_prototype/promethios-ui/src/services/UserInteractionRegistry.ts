/**
 * User Interaction Registry Service
 * 
 * Unified system for managing all types of user-to-user interactions:
 * - Connection requests
 * - Collaboration invitations  
 * - Chat invitations
 * - Meeting requests
 * - File sharing requests
 * - Any future interaction types
 * 
 * Built on Firebase for real-time, cross-user persistence
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Base interaction interface
export interface UserInteraction {
  id: string;
  type: InteractionType;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserPhoto?: string | null; // Allow null values
  toUserName: string;
  toUserPhoto?: string | null; // Allow null values
  status: InteractionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
  metadata: InteractionMetadata;
}

export type InteractionType = 
  // Existing core interactions
  | 'connection_request'
  | 'collaboration_invitation'
  | 'chat_invitation'
  | 'meeting_request'
  | 'file_share_request'
  | 'team_invitation'
  | 'project_invitation'
  
  // Social Network interactions
  | 'friend_request'
  | 'follow_request'
  | 'post_like'
  | 'post_comment'
  | 'post_share'
  | 'group_invitation'
  | 'event_invitation'
  
  // Marketplace interactions
  | 'buy_request'
  | 'sell_offer'
  | 'price_negotiation'
  | 'transaction_request'
  | 'review_request'
  | 'item_inquiry'
  
  // Professional (LinkedIn-style) interactions
  | 'professional_connection'
  | 'skill_endorsement'
  | 'recommendation_request'
  | 'job_referral'
  | 'business_proposal'
  | 'mentorship_request';

export type InteractionStatus = 
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled';

// Metadata for different interaction types
export interface InteractionMetadata {
  // Common fields
  message?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  
  // Connection-specific
  mutualConnections?: number;
  commonSkills?: string[];
  
  // Collaboration-specific
  conversationId?: string;
  conversationName?: string;
  agentName?: string;
  sessionType?: 'ai_collaboration' | 'human_chat' | 'mixed';
  
  // Meeting-specific
  meetingTime?: Timestamp;
  meetingDuration?: number;
  meetingType?: 'video' | 'audio' | 'chat';
  
  // File sharing-specific
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // Team/Project-specific
  teamId?: string;
  projectId?: string;
  role?: string;
  permissions?: string[];
  
  // Social Network-specific
  postId?: string;
  groupId?: string;
  eventId?: string;
  visibility?: 'public' | 'friends' | 'private';
  shareReason?: string;
  
  // Marketplace-specific
  itemId?: string;
  itemTitle?: string;
  price?: number;
  currency?: string;
  offerPrice?: number;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  category?: string;
  location?: string;
  
  // Professional-specific
  skill?: string;
  jobId?: string;
  companyId?: string;
  endorsementText?: string;
  recommendationType?: 'colleague' | 'manager' | 'client' | 'mentor';
  yearsWorkedTogether?: number;
  position?: string;
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

export interface UserInteractionStats {
  totalInteractions: number;
  pendingRequests: number;
  sentRequests: number;
  acceptedInteractions: number;
  declinedInteractions: number;
  responseRate: number;
  averageResponseTime: number;
}

// User Relationship System
export type RelationshipType = 
  | 'connected'           // Basic connection
  | 'friend'             // Social friend
  | 'follower'           // Social follow (one-way)
  | 'following'          // Social follow (reverse)
  | 'professional'       // LinkedIn-style professional
  | 'collaborator'       // AI collaboration partner
  | 'chat_partner'       // Direct chat relationship
  | 'business_contact'   // Marketplace relationship
  | 'team_member'        // Same team/organization
  | 'mentor'             // Mentorship relationship
  | 'mentee';            // Reverse mentorship

export interface UserRelationship {
  id: string;
  userId1: string;
  userId2: string;
  relationshipType: RelationshipType[];
  connectionStrength: number; // 0-100
  createdAt: Timestamp;
  lastInteraction: Timestamp;
  interactionCount: number;
  metadata: RelationshipMetadata;
}

export interface RelationshipMetadata {
  mutualConnections?: number;
  commonInterests?: string[];
  collaborationHistory?: string[];
  transactionHistory?: string[];
  sharedGroups?: string[];
  workHistory?: {
    company: string;
    period: string;
    overlap: boolean;
  }[];
  endorsements?: {
    skill: string;
    endorserId: string;
    date: Timestamp;
  }[];
}

class UserInteractionRegistry {
  private static instance: UserInteractionRegistry;
  private readonly INTERACTIONS_COLLECTION = 'userInteractions';
  private readonly NOTIFICATIONS_COLLECTION = 'interactionNotifications';
  private readonly RELATIONSHIPS_COLLECTION = 'userRelationships';
  private readonly USERS_COLLECTION = 'users';
  
  // Real-time listeners
  private listeners: Map<string, Unsubscribe> = new Map();

  static getInstance(): UserInteractionRegistry {
    if (!UserInteractionRegistry.instance) {
      UserInteractionRegistry.instance = new UserInteractionRegistry();
    }
    return UserInteractionRegistry.instance;
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
      console.log(`🔗 [UserRegistry] Sending ${type} from ${fromUserId} to ${toUserId}`);
      console.log(`🔗 [UserRegistry] Metadata:`, metadata);

      // Get user information
      const [fromUser, toUser] = await Promise.all([
        this.getUserInfo(fromUserId),
        this.getUserInfo(toUserId)
      ]);

      if (!fromUser || !toUser) {
        console.error('❌ [UserRegistry] User information not found:', { fromUser: !!fromUser, toUser: !!toUser });
        return { success: false, error: 'User information not found' };
      }

      console.log('✅ [UserRegistry] User information retrieved:', {
        fromUser: fromUser.displayName || fromUser.email,
        toUser: toUser.displayName || toUser.email
      });

      // Check for existing pending interaction of same type
      const existingInteraction = await this.getPendingInteraction(fromUserId, toUserId, type);
      if (existingInteraction) {
        console.log('⚠️ [UserRegistry] Existing pending interaction found:', existingInteraction.id);
        return { success: false, error: `${type} already sent` };
      }

      // Create interaction
      const interactionId = `${type}_${fromUserId}_${toUserId}_${Date.now()}`;
      const interaction: Omit<UserInteraction, 'id'> = {
        type,
        fromUserId,
        toUserId,
        fromUserName: fromUser.displayName || fromUser.email,
        fromUserPhoto: fromUser.photoURL || null, // Provide null instead of undefined
        toUserName: toUser.displayName || toUser.email,
        toUserPhoto: toUser.photoURL || null, // Provide null instead of undefined
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
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
      console.log('🔗 [UserRegistry] Saving interaction to Firebase...');
      await setDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), interaction);
      console.log('✅ [UserRegistry] Interaction saved to Firebase');

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

      // Update user stats
      console.log('🔗 [UserRegistry] Updating user stats...');
      await this.updateUserStats(fromUserId, { sentRequests: increment(1) });
      await this.updateUserStats(toUserId, { pendingRequests: increment(1) });
      console.log('✅ [UserRegistry] User stats updated');

      console.log(`✅ [UserRegistry] ${type} sent successfully: ${interactionId}`);
      return { success: true, interactionId };

    } catch (error) {
      console.error(`❌ [UserRegistry] Error sending ${type}:`, error);
      console.error(`❌ [UserRegistry] Error details:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return { success: false, error: `Failed to send ${type}: ${error.message}` };
    }
  }

  /**
   * Respond to an interaction (accept/decline)
   */
  async respondToInteraction(
    interactionId: string,
    userId: string,
    response: 'accepted' | 'declined'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔗 [UserRegistry] ${response} interaction: ${interactionId}`);

      const interactionDoc = await getDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId));
      if (!interactionDoc.exists()) {
        return { success: false, error: 'Interaction not found' };
      }

      const interaction = { id: interactionDoc.id, ...interactionDoc.data() } as UserInteraction;
      
      // Verify user is the recipient
      if (interaction.toUserId !== userId) {
        return { success: false, error: 'Unauthorized to respond to this interaction' };
      }

      if (interaction.status !== 'pending') {
        return { success: false, error: 'Interaction is no longer pending' };
      }

      // Update interaction status
      await updateDoc(doc(db, this.INTERACTIONS_COLLECTION, interactionId), {
        status: response,
        updatedAt: serverTimestamp()
      });

      // Create notifications for both users
      await Promise.all([
        // Notify sender
        this.createNotification({
          userId: interaction.fromUserId,
          interactionId,
          type: interaction.type,
          title: `${interaction.type.replace('_', ' ')} ${response}`,
          message: `${interaction.toUserName} ${response} your ${interaction.type.replace('_', ' ')}`,
          actionUrl: this.getActionUrl(interaction.type, interactionId, interaction.metadata)
        }),
        // Notify recipient (confirmation)
        this.createNotification({
          userId: interaction.toUserId,
          interactionId,
          type: interaction.type,
          title: `${interaction.type.replace('_', ' ')} ${response}`,
          message: `You ${response} ${interaction.fromUserName}'s ${interaction.type.replace('_', ' ')}`,
          actionUrl: this.getActionUrl(interaction.type, interactionId, interaction.metadata)
        })
      ]);

      // Update user stats
      await this.updateUserStats(interaction.fromUserId, { 
        [response === 'accepted' ? 'acceptedInteractions' : 'declinedInteractions']: increment(1) 
      });
      await this.updateUserStats(interaction.toUserId, { 
        pendingRequests: increment(-1),
        [response === 'accepted' ? 'acceptedInteractions' : 'declinedInteractions']: increment(1)
      });

      // Handle type-specific post-response actions
      if (response === 'accepted') {
        await this.handleAcceptedInteraction(interaction);
      }

      console.log(`✅ [UserRegistry] Interaction ${response}: ${interactionId}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ [UserRegistry] Error responding to interaction:`, error);
      return { success: false, error: 'Failed to respond to interaction' };
    }
  }

  /**
   * Get pending interactions for a user
   */
  async getPendingInteractions(userId: string, type?: InteractionType): Promise<UserInteraction[]> {
    try {
      let q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('toUserId', '==', userId),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserInteraction));

    } catch (error) {
      console.error('❌ [UserRegistry] Error getting pending interactions:', error);
      return [];
    }
  }

  /**
   * Get sent interactions for a user
   */
  async getSentInteractions(userId: string, type?: InteractionType): Promise<UserInteraction[]> {
    try {
      let q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('fromUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserInteraction));

    } catch (error) {
      console.error('❌ [UserRegistry] Error getting sent interactions:', error);
      return [];
    }
  }

  /**
   * Subscribe to real-time updates for user interactions
   */
  subscribeToInteractions(
    userId: string,
    callback: (interactions: UserInteraction[]) => void,
    type?: InteractionType
  ): Unsubscribe {
    const listenerId = `${userId}_${type || 'all'}`;
    
    // Unsubscribe existing listener if any
    const existingListener = this.listeners.get(listenerId);
    if (existingListener) {
      existingListener();
    }

    let q = query(
      collection(db, this.INTERACTIONS_COLLECTION),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    if (type) {
      q = query(q, where('type', '==', type));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interactions = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as UserInteraction));
      callback(interactions);
    });

    this.listeners.set(listenerId, unsubscribe);
    return unsubscribe;
  }

  // Private helper methods
  private async getUserInfo(userId: string): Promise<any> {
    try {
      console.log('👤 [UserRegistry] Looking up user info for ID:', userId);
      const userDoc = await getDoc(doc(db, this.USERS_COLLECTION, userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      console.log('👤 [UserRegistry] User data found:', userData ? `${userData.displayName || userData.email} (${userId})` : 'null');
      return userData;
    } catch (error) {
      console.error('❌ [UserRegistry] Error getting user info for', userId, ':', error);
      return null;
    }
  }

  private async getPendingInteraction(
    fromUserId: string, 
    toUserId: string, 
    type: InteractionType
  ): Promise<UserInteraction | null> {
    try {
      const q = query(
        collection(db, this.INTERACTIONS_COLLECTION),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId),
        where('type', '==', type),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UserInteraction;

    } catch (error) {
      console.error('Error checking pending interaction:', error);
      return null;
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
      
      // Check if Firebase is available
      if (!db) {
        console.error('❌ [UserRegistry] Firebase db is not available');
        throw new Error('Firebase database not initialized');
      }
      
      // Check Firebase auth state
      const { auth } = await import('../firebase/config');
      const currentUser = auth.currentUser;
      console.log('🔔 [UserRegistry] Firebase auth state:', {
        isAuthenticated: !!currentUser,
        uid: currentUser?.uid,
        email: currentUser?.email,
        displayName: currentUser?.displayName
      });
      
      if (!currentUser) {
        console.error('❌ [UserRegistry] No authenticated user - this is the root cause!');
        console.error('❌ [UserRegistry] Firebase requires authentication to write to Firestore');
        throw new Error('User must be authenticated to create notifications');
      }
      
      // Prepare notification data
      const notificationData = {
        ...notification,
        read: false,
        createdAt: serverTimestamp()
      };
      
      console.log('🔔 [UserRegistry] Notification data to write:', notificationData);
      console.log('🔔 [UserRegistry] Writing to collection:', this.NOTIFICATIONS_COLLECTION);
      console.log('🔔 [UserRegistry] Document ID:', notificationId);
      
      // Attempt to write to Firebase
      const docRef = doc(db, this.NOTIFICATIONS_COLLECTION, notificationId);
      console.log('🔔 [UserRegistry] Document reference created:', docRef.path);
      
      await setDoc(docRef, notificationData);
      
      console.log('✅ [UserRegistry] Notification created successfully in Firebase:', notificationId);
      
      // Verify the write by reading it back
      try {
        const verifyDoc = await getDoc(docRef);
        if (verifyDoc.exists()) {
          console.log('✅ [UserRegistry] Notification verified in Firebase:', verifyDoc.data());
        } else {
          console.error('❌ [UserRegistry] Notification not found after write - possible write failure');
        }
      } catch (verifyError) {
        console.error('❌ [UserRegistry] Error verifying notification write:', verifyError);
      }
      
    } catch (error) {
      console.error('❌ [UserRegistry] Error creating notification:', error);
      console.error('❌ [UserRegistry] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error; // Re-throw to propagate the error
    }
  }

  private async updateUserStats(userId: string, updates: any): Promise<void> {
    try {
      await updateDoc(doc(db, this.USERS_COLLECTION, userId), {
        ...Object.keys(updates).reduce((acc, key) => {
          acc[`interactionStats.${key}`] = updates[key];
          return acc;
        }, {} as any),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }

  // ===== RELATIONSHIP MANAGEMENT METHODS =====

  /**
   * Create or update a relationship between two users
   */
  async createRelationship(
    userId1: string,
    userId2: string,
    relationshipType: RelationshipType,
    metadata: Partial<RelationshipMetadata> = {}
  ): Promise<{ success: boolean; relationshipId?: string; error?: string }> {
    try {
      console.log(`🔗 [UserRegistry] Creating ${relationshipType} relationship between ${userId1} and ${userId2}`);

      // Ensure consistent ordering (smaller ID first)
      const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
      const relationshipId = `${user1}_${user2}`;

      // Check if relationship already exists
      const existingRelationship = await this.getRelationship(user1, user2);
      
      if (existingRelationship) {
        // Update existing relationship by adding new type
        const updatedTypes = [...new Set([...existingRelationship.relationshipType, relationshipType])];
        
        await updateDoc(doc(db, this.RELATIONSHIPS_COLLECTION, relationshipId), {
          relationshipType: updatedTypes,
          lastInteraction: serverTimestamp(),
          interactionCount: increment(1),
          metadata: { ...existingRelationship.metadata, ...metadata },
          updatedAt: serverTimestamp()
        });

        return { success: true, relationshipId };
      } else {
        // Create new relationship
        const newRelationship: Omit<UserRelationship, 'id'> = {
          userId1: user1,
          userId2: user2,
          relationshipType: [relationshipType],
          connectionStrength: this.calculateInitialConnectionStrength(relationshipType),
          createdAt: serverTimestamp() as Timestamp,
          lastInteraction: serverTimestamp() as Timestamp,
          interactionCount: 1,
          metadata: metadata as RelationshipMetadata
        };

        await setDoc(doc(db, this.RELATIONSHIPS_COLLECTION, relationshipId), newRelationship);
        return { success: true, relationshipId };
      }

    } catch (error) {
      console.error('Error creating relationship:', error);
      return { success: false, error: 'Failed to create relationship' };
    }
  }

  /**
   * Get relationship between two users
   */
  async getRelationship(userId1: string, userId2: string): Promise<UserRelationship | null> {
    try {
      const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
      const relationshipId = `${user1}_${user2}`;
      
      const relationshipDoc = await getDoc(doc(db, this.RELATIONSHIPS_COLLECTION, relationshipId));
      
      if (relationshipDoc.exists()) {
        return { id: relationshipDoc.id, ...relationshipDoc.data() } as UserRelationship;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting relationship:', error);
      return null;
    }
  }

  /**
   * Get all relationships for a user
   */
  async getRelationships(
    userId: string,
    relationshipType?: RelationshipType
  ): Promise<UserRelationship[]> {
    try {
      let q = query(
        collection(db, this.RELATIONSHIPS_COLLECTION),
        where('userId1', '==', userId)
      );

      const q2 = query(
        collection(db, this.RELATIONSHIPS_COLLECTION),
        where('userId2', '==', userId)
      );

      const [snapshot1, snapshot2] = await Promise.all([getDocs(q), getDocs(q2)]);
      
      const relationships = [
        ...snapshot1.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRelationship)),
        ...snapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRelationship))
      ];

      if (relationshipType) {
        return relationships.filter(rel => rel.relationshipType.includes(relationshipType));
      }

      return relationships;
    } catch (error) {
      console.error('Error getting relationships:', error);
      return [];
    }
  }

  /**
   * Get mutual connections between two users
   */
  async getMutualConnections(userId1: string, userId2: string): Promise<UserRelationship[]> {
    try {
      const [user1Relationships, user2Relationships] = await Promise.all([
        this.getRelationships(userId1, 'connected'),
        this.getRelationships(userId2, 'connected')
      ]);

      const user1Connections = new Set(
        user1Relationships.map(rel => 
          rel.userId1 === userId1 ? rel.userId2 : rel.userId1
        )
      );

      const mutualConnections = user2Relationships.filter(rel => {
        const otherUserId = rel.userId1 === userId2 ? rel.userId2 : rel.userId1;
        return user1Connections.has(otherUserId);
      });

      return mutualConnections;
    } catch (error) {
      console.error('Error getting mutual connections:', error);
      return [];
    }
  }

  /**
   * Update relationship strength based on interactions
   */
  async updateRelationshipStrength(
    userId1: string,
    userId2: string,
    strengthDelta: number
  ): Promise<void> {
    try {
      const [user1, user2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
      const relationshipId = `${user1}_${user2}`;

      const relationship = await this.getRelationship(user1, user2);
      if (relationship) {
        const newStrength = Math.max(0, Math.min(100, relationship.connectionStrength + strengthDelta));
        
        await updateDoc(doc(db, this.RELATIONSHIPS_COLLECTION, relationshipId), {
          connectionStrength: newStrength,
          lastInteraction: serverTimestamp(),
          interactionCount: increment(1)
        });
      }
    } catch (error) {
      console.error('Error updating relationship strength:', error);
    }
  }

  /**
   * Subscribe to relationship changes for a user
   */
  subscribeToRelationships(
    userId: string,
    callback: (relationships: UserRelationship[]) => void
  ): Unsubscribe {
    const q1 = query(
      collection(db, this.RELATIONSHIPS_COLLECTION),
      where('userId1', '==', userId)
    );

    const q2 = query(
      collection(db, this.RELATIONSHIPS_COLLECTION),
      where('userId2', '==', userId)
    );

    // We need to combine two queries, so we'll use a simple approach
    let relationships1: UserRelationship[] = [];
    let relationships2: UserRelationship[] = [];

    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      relationships1 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRelationship));
      callback([...relationships1, ...relationships2]);
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      relationships2 = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRelationship));
      callback([...relationships1, ...relationships2]);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }

  private calculateInitialConnectionStrength(relationshipType: RelationshipType): number {
    const strengthMap: Record<RelationshipType, number> = {
      'connected': 30,
      'friend': 50,
      'follower': 20,
      'following': 20,
      'professional': 40,
      'collaborator': 60,
      'chat_partner': 35,
      'business_contact': 25,
      'team_member': 70,
      'mentor': 80,
      'mentee': 80
    };

    return strengthMap[relationshipType] || 30;
  }

  private async handleAcceptedInteraction(interaction: UserInteraction): Promise<void> {
    switch (interaction.type) {
      case 'connection_request':
        // Create connection record (existing logic)
        break;
      case 'collaboration_invitation':
        // Add user to shared conversation
        // This would integrate with SharedConversationService
        break;
      case 'team_invitation':
        // Add user to team
        break;
      // Add other type-specific handlers
    }
  }
}

export const userInteractionRegistry = UserInteractionRegistry.getInstance();
export default userInteractionRegistry;

