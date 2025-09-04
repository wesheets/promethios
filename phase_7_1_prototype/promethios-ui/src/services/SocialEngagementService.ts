/**
 * Social Engagement Service
 * 
 * Handles advanced social engagement features including shares, bookmarks,
 * user connections, and engagement analytics.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { FirebaseProfileService } from './FirebaseProfileService';
import { UnifiedNotificationService } from './UnifiedNotificationService';

export interface SocialShare {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  shareType: 'direct' | 'repost' | 'external';
  platform?: 'linkedin' | 'twitter' | 'email' | 'copy_link';
  message?: string;
  createdAt: Timestamp;
}

export interface SocialBookmark {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp;
}

export interface UserConnection {
  id?: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  connectionType: 'professional' | 'collaboration' | 'mentorship';
  message?: string;
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  updatedAt: Timestamp;
}

export interface EngagementMetrics {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalViews: number;
  engagementRate: number;
  topEngagers: {
    userId: string;
    userName: string;
    userAvatar?: string;
    engagementScore: number;
  }[];
}

class SocialEngagementService {
  private profileService = new FirebaseProfileService();
  private notificationService = UnifiedNotificationService.getInstance();

  /**
   * Share a post
   */
  async sharePost(
    postId: string, 
    shareType: 'direct' | 'repost' | 'external',
    platform?: string,
    message?: string
  ): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to share posts');
      }

      // Get user profile for share attribution
      const userProfile = await this.profileService.getUserProfile(currentUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Create share document
      const shareRef = doc(collection(db, 'socialShares'));
      const shareId = shareRef.id;

      const shareData: SocialShare = {
        id: shareId,
        postId,
        userId: currentUser.uid,
        userName: userProfile.name || userProfile.displayName || 'Unknown User',
        userAvatar: userProfile.avatar || currentUser.photoURL || '',
        shareType,
        platform: platform as any,
        message: message?.trim(),
        createdAt: serverTimestamp() as Timestamp
      };

      await setDoc(shareRef, shareData);

      // Update post share count
      const postRef = doc(db, 'socialPosts', postId);
      await updateDoc(postRef, {
        'metrics.shares': increment(1),
        updatedAt: serverTimestamp()
      });

      // Send notification to post author
      await this.sendShareNotification(postId, shareId);

      console.log('✅ [SocialEngagementService] Post shared successfully:', shareId);
      return shareId;
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error sharing post:', error);
      throw error;
    }
  }

  /**
   * Bookmark or unbookmark a post
   */
  async toggleBookmark(postId: string): Promise<{ isBookmarked: boolean }> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to bookmark posts');
      }

      const userId = currentUser.uid;
      const bookmarkId = `${postId}_${userId}`;
      const bookmarkRef = doc(db, 'socialBookmarks', bookmarkId);

      // Check if bookmark already exists
      const bookmarkDoc = await getDoc(bookmarkRef);
      const isCurrentlyBookmarked = bookmarkDoc.exists();

      if (isCurrentlyBookmarked) {
        // Remove bookmark
        await deleteDoc(bookmarkRef);
        console.log('🔖 [SocialEngagementService] Post unbookmarked:', postId);
        return { isBookmarked: false };
      } else {
        // Add bookmark
        const userProfile = await this.profileService.getUserProfile(userId);
        
        const bookmarkData: SocialBookmark = {
          id: bookmarkId,
          postId,
          userId,
          userName: userProfile?.name || userProfile?.displayName || 'Unknown User',
          userAvatar: userProfile?.avatar || currentUser.photoURL || '',
          createdAt: serverTimestamp() as Timestamp
        };

        await setDoc(bookmarkRef, bookmarkData);
        console.log('🔖 [SocialEngagementService] Post bookmarked:', postId);
        return { isBookmarked: true };
      }
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error toggling bookmark:', error);
      throw error;
    }
  }

  /**
   * Send connection request
   */
  async sendConnectionRequest(
    toUserId: string,
    connectionType: 'professional' | 'collaboration' | 'mentorship',
    message?: string
  ): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to send connection requests');
      }

      const fromUserId = currentUser.uid;
      
      if (fromUserId === toUserId) {
        throw new Error('Cannot send connection request to yourself');
      }

      // Check if connection already exists
      const existingConnectionQuery = query(
        collection(db, 'socialConnections'),
        where('fromUserId', '==', fromUserId),
        where('toUserId', '==', toUserId)
      );
      
      const existingConnections = await getDocs(existingConnectionQuery);
      
      if (!existingConnections.empty) {
        throw new Error('Connection request already exists');
      }

      // Create connection request
      const connectionRef = doc(collection(db, 'socialConnections'));
      const connectionId = connectionRef.id;

      const connectionData: UserConnection = {
        id: connectionId,
        fromUserId,
        toUserId,
        status: 'pending',
        connectionType,
        message: message?.trim(),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(connectionRef, connectionData);

      // Send notification
      await this.notificationService.sendConnectionRequest(fromUserId, toUserId, message);

      console.log('✅ [SocialEngagementService] Connection request sent:', connectionId);
      return connectionId;
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error sending connection request:', error);
      throw error;
    }
  }

  /**
   * Accept connection request
   */
  async acceptConnectionRequest(connectionId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to accept connections');
      }

      const connectionRef = doc(db, 'socialConnections', connectionId);
      const connectionDoc = await getDoc(connectionRef);
      
      if (!connectionDoc.exists()) {
        throw new Error('Connection request not found');
      }

      const connectionData = connectionDoc.data() as UserConnection;
      
      if (connectionData.toUserId !== currentUser.uid) {
        throw new Error('Only the recipient can accept this connection request');
      }

      if (connectionData.status !== 'pending') {
        throw new Error('Connection request is not pending');
      }

      // Update connection status
      await updateDoc(connectionRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create reverse connection for bidirectional relationship
      const reverseConnectionRef = doc(collection(db, 'socialConnections'));
      const reverseConnectionData: UserConnection = {
        id: reverseConnectionRef.id,
        fromUserId: connectionData.toUserId,
        toUserId: connectionData.fromUserId,
        status: 'accepted',
        connectionType: connectionData.connectionType,
        createdAt: serverTimestamp() as Timestamp,
        acceptedAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(reverseConnectionRef, reverseConnectionData);

      console.log('✅ [SocialEngagementService] Connection request accepted:', connectionId);
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error accepting connection request:', error);
      throw error;
    }
  }

  /**
   * Get user's bookmarked posts
   */
  async getUserBookmarks(userId: string, limitCount: number = 20): Promise<string[]> {
    try {
      const bookmarksQuery = query(
        collection(db, 'socialBookmarks'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      const postIds = bookmarksSnapshot.docs.map(doc => doc.data().postId);

      return postIds;
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error getting user bookmarks:', error);
      return [];
    }
  }

  /**
   * Get user's connections
   */
  async getUserConnections(userId: string, status: 'pending' | 'accepted' = 'accepted'): Promise<UserConnection[]> {
    try {
      const connectionsQuery = query(
        collection(db, 'socialConnections'),
        where('fromUserId', '==', userId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const connectionsSnapshot = await getDocs(connectionsQuery);
      const connections = connectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserConnection[];

      return connections;
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error getting user connections:', error);
      return [];
    }
  }

  /**
   * Get engagement metrics for a post
   */
  async getPostEngagementMetrics(postId: string): Promise<EngagementMetrics> {
    try {
      // Get likes
      const likesQuery = query(
        collection(db, 'socialLikes'),
        where('postId', '==', postId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      const totalLikes = likesSnapshot.size;

      // Get comments
      const commentsQuery = query(
        collection(db, 'socialComments'),
        where('postId', '==', postId),
        where('isActive', '==', true)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const totalComments = commentsSnapshot.size;

      // Get shares
      const sharesQuery = query(
        collection(db, 'socialShares'),
        where('postId', '==', postId)
      );
      const sharesSnapshot = await getDocs(sharesQuery);
      const totalShares = sharesSnapshot.size;

      // Get post views (from post document)
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      const totalViews = postDoc.data()?.metrics?.views || 0;

      // Calculate engagement rate
      const totalEngagements = totalLikes + totalComments + totalShares;
      const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;

      // Get top engagers (simplified - could be more sophisticated)
      const topEngagers: EngagementMetrics['topEngagers'] = [];

      return {
        totalLikes,
        totalComments,
        totalShares,
        totalViews,
        engagementRate,
        topEngagers
      };
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error getting engagement metrics:', error);
      return {
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        engagementRate: 0,
        topEngagers: []
      };
    }
  }

  /**
   * Check if user has bookmarked a post
   */
  async hasUserBookmarked(postId: string, userId: string): Promise<boolean> {
    try {
      const bookmarkId = `${postId}_${userId}`;
      const bookmarkRef = doc(db, 'socialBookmarks', bookmarkId);
      const bookmarkDoc = await getDoc(bookmarkRef);
      return bookmarkDoc.exists();
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error checking bookmark status:', error);
      return false;
    }
  }

  /**
   * Increment post view count
   */
  async incrementViewCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'socialPosts', postId);
      await updateDoc(postRef, {
        'metrics.views': increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error incrementing view count:', error);
    }
  }

  /**
   * Send share notification
   */
  private async sendShareNotification(postId: string, shareId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get post data to notify post author
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const postData = postDoc.data();
        
        // Notify post author (if not sharing own post)
        if (postData.authorId !== currentUser.uid) {
          await this.notificationService.sendSocialNotification(
            'post_share',
            currentUser.uid,
            postData.authorId,
            postId,
            postData.title,
            { shareId }
          );
        }
      }
    } catch (error) {
      console.error('❌ [SocialEngagementService] Error sending share notification:', error);
    }
  }

  /**
   * Subscribe to real-time connection updates
   */
  subscribeToConnectionRequests(userId: string, callback: (connections: UserConnection[]) => void): () => void {
    const q = query(
      collection(db, 'socialConnections'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const connections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserConnection[];
      
      callback(connections);
    });
  }
}

export const socialEngagementService = new SocialEngagementService();

