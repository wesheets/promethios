/**
 * Social Real-time Service
 * 
 * Manages real-time updates for the social feed including live post updates,
 * instant notifications, presence indicators, and collaborative features.
 */

import { 
  collection, 
  doc, 
  onSnapshot,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { FeedPost } from '../components/social/SocialFeedPost';
import { SocialComment, CommentThread } from './SocialCommentsService';
import { UserConnection } from './SocialEngagementService';

export interface RealtimeUpdate {
  type: 'post_created' | 'post_updated' | 'post_deleted' | 
        'comment_added' | 'comment_updated' | 'comment_deleted' |
        'like_added' | 'like_removed' | 'share_added' |
        'connection_request' | 'connection_accepted';
  data: any;
  timestamp: Timestamp;
  userId: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: Timestamp;
  currentActivity?: {
    type: 'viewing_feed' | 'commenting' | 'creating_post';
    postId?: string;
    details?: string;
  };
}

export interface LiveNotification {
  id: string;
  type: 'post_like' | 'post_comment' | 'post_share' | 'connection_request' | 'mention';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  message: string;
  postId?: string;
  postTitle?: string;
  read: boolean;
  createdAt: Timestamp;
}

export interface SocialFeedSubscription {
  unsubscribe: () => void;
  feedType: string;
  filters: any;
}

class SocialRealtimeService {
  private activeSubscriptions: Map<string, () => void> = new Map();
  private presenceUpdateInterval: NodeJS.Timeout | null = null;
  private currentUserPresence: UserPresence | null = null;

  /**
   * Subscribe to real-time feed updates
   */
  subscribeFeedUpdates(
    feedType: string,
    filters: any,
    callback: (posts: FeedPost[]) => void
  ): SocialFeedSubscription {
    const subscriptionKey = `feed_${feedType}_${JSON.stringify(filters)}`;
    
    // Unsubscribe from existing subscription if any
    this.unsubscribe(subscriptionKey);

    console.log('🔄 [SocialRealtimeService] Subscribing to feed updates:', feedType);

    // Build query based on feed type and filters
    let q = query(
      collection(db, 'socialPosts'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    // Apply filters based on feed type
    if (feedType === 'trending') {
      q = query(
        collection(db, 'socialPosts'),
        where('isActive', '==', true),
        where('isTrending', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else if (feedType === 'following') {
      // TODO: Implement following filter based on user connections
      console.log('⚠️ [SocialRealtimeService] Following feed not yet implemented');
    }

    // Apply additional filters
    if (filters.postTypes && filters.postTypes.length > 0) {
      q = query(q, where('type', 'in', filters.postTypes));
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot: QuerySnapshot) => {
        try {
          const posts = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString()
            } as FeedPost;
          });

          console.log(`✅ [SocialRealtimeService] Feed updated: ${posts.length} posts`);
          callback(posts);
        } catch (error) {
          console.error('❌ [SocialRealtimeService] Error processing feed update:', error);
        }
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] Feed subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);

    return {
      unsubscribe: () => this.unsubscribe(subscriptionKey),
      feedType,
      filters
    };
  }

  /**
   * Subscribe to real-time post updates (likes, comments, shares)
   */
  subscribePostUpdates(postId: string, callback: (post: Partial<FeedPost>) => void): () => void {
    const subscriptionKey = `post_${postId}`;
    
    console.log('🔄 [SocialRealtimeService] Subscribing to post updates:', postId);

    const postRef = doc(db, 'socialPosts', postId);
    const unsubscribe = onSnapshot(postRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const updatedPost = {
            id: snapshot.id,
            metrics: data.metrics,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString()
          };
          
          console.log('✅ [SocialRealtimeService] Post updated:', postId);
          callback(updatedPost);
        }
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] Post subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeNotifications(userId: string, callback: (notifications: LiveNotification[]) => void): () => void {
    const subscriptionKey = `notifications_${userId}`;
    
    console.log('🔔 [SocialRealtimeService] Subscribing to notifications:', userId);

    const q = query(
      collection(db, 'socialNotifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        try {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as LiveNotification[];

          console.log(`🔔 [SocialRealtimeService] Notifications updated: ${notifications.length} unread`);
          callback(notifications);
        } catch (error) {
          console.error('❌ [SocialRealtimeService] Error processing notifications:', error);
        }
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] Notifications subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to connection requests
   */
  subscribeConnectionRequests(userId: string, callback: (requests: UserConnection[]) => void): () => void {
    const subscriptionKey = `connections_${userId}`;
    
    console.log('🤝 [SocialRealtimeService] Subscribing to connection requests:', userId);

    const q = query(
      collection(db, 'socialConnections'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        try {
          const requests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as UserConnection[];

          console.log(`🤝 [SocialRealtimeService] Connection requests updated: ${requests.length} pending`);
          callback(requests);
        } catch (error) {
          console.error('❌ [SocialRealtimeService] Error processing connection requests:', error);
        }
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] Connection requests subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to user presence updates
   */
  subscribeUserPresence(callback: (users: UserPresence[]) => void): () => void {
    const subscriptionKey = 'user_presence';
    
    console.log('👥 [SocialRealtimeService] Subscribing to user presence');

    const q = query(
      collection(db, 'userPresence'),
      where('status', 'in', ['online', 'away']),
      orderBy('lastSeen', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        try {
          const users = snapshot.docs.map(doc => ({
            userId: doc.id,
            ...doc.data()
          })) as UserPresence[];

          console.log(`👥 [SocialRealtimeService] User presence updated: ${users.length} online`);
          callback(users);
        } catch (error) {
          console.error('❌ [SocialRealtimeService] Error processing user presence:', error);
        }
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] User presence subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Start user presence tracking
   */
  startPresenceTracking(): void {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('⚠️ [SocialRealtimeService] Cannot start presence tracking - user not authenticated');
      return;
    }

    console.log('👤 [SocialRealtimeService] Starting presence tracking for:', currentUser.uid);

    // Update presence every 30 seconds
    this.presenceUpdateInterval = setInterval(() => {
      this.updateUserPresence('online', {
        type: 'viewing_feed'
      });
    }, 30000);

    // Set initial presence
    this.updateUserPresence('online', {
      type: 'viewing_feed'
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateUserPresence('away');
      } else {
        this.updateUserPresence('online', {
          type: 'viewing_feed'
        });
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.updateUserPresence('offline');
    });
  }

  /**
   * Stop user presence tracking
   */
  stopPresenceTracking(): void {
    console.log('👤 [SocialRealtimeService] Stopping presence tracking');

    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }

    this.updateUserPresence('offline');
  }

  /**
   * Update user presence
   */
  private async updateUserPresence(
    status: 'online' | 'away' | 'offline',
    activity?: UserPresence['currentActivity']
  ): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const presenceRef = doc(db, 'userPresence', currentUser.uid);
      const presenceData: Partial<UserPresence> = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email || 'Unknown User',
        userAvatar: currentUser.photoURL || '',
        status,
        lastSeen: Timestamp.now(),
        currentActivity: activity
      };

      // Use setDoc with merge to update presence
      await import('firebase/firestore').then(({ setDoc }) => 
        setDoc(presenceRef, presenceData, { merge: true })
      );

      this.currentUserPresence = presenceData as UserPresence;
    } catch (error) {
      console.error('❌ [SocialRealtimeService] Error updating user presence:', error);
    }
  }

  /**
   * Update user activity
   */
  updateUserActivity(activity: UserPresence['currentActivity']): void {
    if (this.currentUserPresence?.status === 'online') {
      this.updateUserPresence('online', activity);
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  private unsubscribe(subscriptionKey: string): void {
    const unsubscribe = this.activeSubscriptions.get(subscriptionKey);
    if (unsubscribe) {
      unsubscribe();
      this.activeSubscriptions.delete(subscriptionKey);
      console.log('🔌 [SocialRealtimeService] Unsubscribed from:', subscriptionKey);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    console.log('🔌 [SocialRealtimeService] Unsubscribing from all subscriptions');
    
    this.activeSubscriptions.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log('🔌 [SocialRealtimeService] Unsubscribed from:', key);
    });
    
    this.activeSubscriptions.clear();
    this.stopPresenceTracking();
  }

  /**
   * Get current subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.activeSubscriptions.size;
  }

  /**
   * Send real-time update to other users
   */
  async broadcastUpdate(update: Omit<RealtimeUpdate, 'timestamp' | 'userId'>): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) return;

      const updateData: RealtimeUpdate = {
        ...update,
        timestamp: Timestamp.now(),
        userId: currentUser.uid
      };

      // Store update in Firebase for real-time distribution
      const updatesRef = collection(db, 'realtimeUpdates');
      await import('firebase/firestore').then(({ addDoc }) => 
        addDoc(updatesRef, updateData)
      );

      console.log('📡 [SocialRealtimeService] Update broadcasted:', update.type);
    } catch (error) {
      console.error('❌ [SocialRealtimeService] Error broadcasting update:', error);
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeUpdates(callback: (update: RealtimeUpdate) => void): () => void {
    const subscriptionKey = 'realtime_updates';
    
    console.log('📡 [SocialRealtimeService] Subscribing to real-time updates');

    const q = query(
      collection(db, 'realtimeUpdates'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q,
      (snapshot: QuerySnapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const update = {
              ...change.doc.data()
            } as RealtimeUpdate;
            
            // Only process updates from other users
            const auth = getAuth();
            if (update.userId !== auth.currentUser?.uid) {
              callback(update);
            }
          }
        });
      },
      (error) => {
        console.error('❌ [SocialRealtimeService] Real-time updates subscription error:', error);
      }
    );

    this.activeSubscriptions.set(subscriptionKey, unsubscribe);
    return () => this.unsubscribe(subscriptionKey);
  }
}

export const socialRealtimeService = new SocialRealtimeService();

