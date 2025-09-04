/**
 * Social Feed Firebase Service
 * 
 * Handles all Firebase operations for the social feed including posts, likes, comments,
 * and integration with the unified notification system.
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
  startAfter,
  increment,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { FeedPost, FeedPostAuthor, FeedPostMetrics } from '../components/social/SocialFeedPost';
import { FirebaseProfileService } from './FirebaseProfileService';
import { UnifiedNotificationService } from './UnifiedNotificationService';

export interface SocialPostData {
  id?: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorTitle?: string;
  authorCompany?: string;
  
  // Post Content
  type: 'collaboration_highlight' | 'ai_showcase' | 'professional_update' | 'industry_insight' | 'connection_announcement';
  title: string;
  content: string;
  tags: string[];
  
  // AI Collaboration Data
  aiAgentsUsed?: {
    id: string;
    name: string;
    type: 'Claude' | 'OpenAI' | 'Gemini' | 'Custom';
    color: string;
  }[];
  collaborationDuration?: number;
  collaborationParticipants?: string[];
  conversationId?: string;
  
  // Attachments
  attachments?: {
    type: 'conversation' | 'document' | 'image' | 'video';
    url: string;
    title: string;
    thumbnail?: string;
  }[];
  
  // Privacy & Visibility
  visibility: 'public' | 'connections' | 'private';
  
  // Engagement Metrics
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    collaborationRating?: number;
  };
  
  // Status
  isActive: boolean;
  isTrending: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SocialLike {
  id?: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp;
}

export interface FeedRequest {
  feedType: string;
  userId?: string;
  filters: any;
  page: number;
  limit: number;
  lastDoc?: QueryDocumentSnapshot;
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  totalCount: number;
  lastDoc?: QueryDocumentSnapshot;
}

class SocialFeedFirebaseService {
  private profileService = new FirebaseProfileService();
  private notificationService = UnifiedNotificationService.getInstance();

  /**
   * Create a new social post
   */
  async createPost(postData: Omit<SocialPostData, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName' | 'authorAvatar' | 'authorTitle' | 'authorCompany' | 'metrics' | 'isActive'>): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to create posts');
      }

      // Get user profile for author information
      const userProfile = await this.profileService.getUserProfile(currentUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Create post document
      const postRef = doc(collection(db, 'socialPosts'));
      const postId = postRef.id;

      const socialPost: SocialPostData = {
        id: postId,
        authorId: currentUser.uid,
        authorName: userProfile.name || userProfile.displayName || 'Unknown User',
        authorAvatar: userProfile.avatar || currentUser.photoURL || '',
        authorTitle: userProfile.title || '',
        authorCompany: userProfile.company || '',
        
        ...postData,
        
        metrics: {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          collaborationRating: postData.collaborationDuration ? 4.5 : undefined
        },
        
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(postRef, socialPost);

      console.log('✅ [SocialFeedFirebase] Post created successfully:', postId);
      return postId;
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get feed posts with pagination
   */
  async getFeedPosts(request: FeedRequest): Promise<FeedResponse> {
    try {
      console.log('📖 [SocialFeedFirebase] Loading feed posts:', request);

      // Build query based on feed type
      let baseQuery = collection(db, 'socialPosts');
      let constraints: any[] = [
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(request.limit)
      ];

      // Add feed type filters
      switch (request.feedType) {
        case 'public':
        case 'for_you':
          constraints.unshift(where('visibility', '==', 'public'));
          break;
        case 'following':
          // TODO: Add connection-based filtering
          constraints.unshift(where('visibility', 'in', ['public', 'connections']));
          break;
        case 'trending':
          constraints.unshift(where('isTrending', '==', true));
          break;
        case 'ai_showcase':
          constraints.unshift(where('type', '==', 'ai_showcase'));
          break;
        case 'industry':
          constraints.unshift(where('type', '==', 'industry_insight'));
          break;
      }

      // Add pagination
      if (request.lastDoc) {
        constraints.push(startAfter(request.lastDoc));
      }

      // Apply filters
      if (request.filters.postTypes?.length > 0) {
        constraints.unshift(where('type', 'in', request.filters.postTypes));
      }

      const q = query(baseQuery, ...constraints);
      const querySnapshot = await getDocs(q);

      // Convert to FeedPost format
      const posts: FeedPost[] = [];
      const auth = getAuth();
      const currentUserId = auth.currentUser?.uid;

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SocialPostData;
        
        // Check if current user liked this post
        const isLiked = currentUserId ? await this.hasUserLikedPost(docSnap.id, currentUserId) : false;
        
        const feedPost: FeedPost = {
          id: docSnap.id,
          author: {
            id: data.authorId,
            name: data.authorName,
            title: data.authorTitle || '',
            company: data.authorCompany || '',
            avatar: data.authorAvatar || '',
            isVerified: false, // TODO: Add verification system
            isConnected: false // TODO: Check connection status
          },
          type: data.type,
          title: data.title,
          content: data.content,
          aiAgentsUsed: data.aiAgentsUsed,
          collaborationDuration: data.collaborationDuration,
          collaborationParticipants: data.collaborationParticipants,
          attachments: data.attachments,
          tags: data.tags,
          visibility: data.visibility,
          metrics: data.metrics,
          isLiked,
          isBookmarked: false, // TODO: Add bookmark system
          isTrending: data.isTrending,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString()
        };

        posts.push(feedPost);
      }

      const hasMore = querySnapshot.docs.length === request.limit;
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      console.log(`✅ [SocialFeedFirebase] Loaded ${posts.length} posts, hasMore: ${hasMore}`);

      return {
        posts,
        hasMore,
        totalCount: posts.length, // TODO: Get actual total count
        lastDoc
      };
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error loading feed posts:', error);
      throw error;
    }
  }

  /**
   * Like or unlike a post
   */
  async toggleLike(postId: string): Promise<{ isLiked: boolean; newLikeCount: number }> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to like posts');
      }

      const userId = currentUser.uid;
      const likeId = `${postId}_${userId}`;
      const likeRef = doc(db, 'socialLikes', likeId);
      const postRef = doc(db, 'socialPosts', postId);

      // Check if like already exists
      const likeDoc = await getDoc(likeRef);
      const isCurrentlyLiked = likeDoc.exists();

      if (isCurrentlyLiked) {
        // Unlike: Remove like and decrement counter
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          'metrics.likes': increment(-1),
          updatedAt: serverTimestamp()
        });

        console.log('👎 [SocialFeedFirebase] Post unliked:', postId);
        
        // Get updated like count
        const updatedPost = await getDoc(postRef);
        const newLikeCount = updatedPost.data()?.metrics?.likes || 0;
        
        return { isLiked: false, newLikeCount };
      } else {
        // Like: Add like and increment counter
        const userProfile = await this.profileService.getUserProfile(userId);
        
        const likeData: SocialLike = {
          id: likeId,
          postId,
          userId,
          userName: userProfile?.name || userProfile?.displayName || 'Unknown User',
          userAvatar: userProfile?.avatar || currentUser.photoURL || '',
          createdAt: serverTimestamp() as Timestamp
        };

        await setDoc(likeRef, likeData);
        await updateDoc(postRef, {
          'metrics.likes': increment(1),
          updatedAt: serverTimestamp()
        });

        console.log('👍 [SocialFeedFirebase] Post liked:', postId);

        // Send notification to post author
        const postDoc = await getDoc(postRef);
        const postData = postDoc.data() as SocialPostData;
        
        if (postData.authorId !== userId) {
          await this.notificationService.sendNotification({
            type: 'connection_request', // TODO: Add 'post_like' type
            fromUserId: userId,
            toUserId: postData.authorId,
            title: 'New Like',
            message: `${likeData.userName} liked your post: "${postData.title}"`,
            metadata: {
              postId,
              postTitle: postData.title
            },
            priority: 'low'
          });
        }

        // Get updated like count
        const updatedPost = await getDoc(postRef);
        const newLikeCount = updatedPost.data()?.metrics?.likes || 1;
        
        return { isLiked: true, newLikeCount };
      }
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Check if user has liked a post
   */
  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${postId}_${userId}`;
      const likeRef = doc(db, 'socialLikes', likeId);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error checking like status:', error);
      return false;
    }
  }

  /**
   * Increment view count for a post
   */
  async incrementViewCount(postId: string): Promise<void> {
    try {
      const postRef = doc(db, 'socialPosts', postId);
      await updateDoc(postRef, {
        'metrics.views': increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error incrementing view count:', error);
    }
  }

  /**
   * Get trending topics
   */
  async getTrendingTopics(): Promise<{ tag: string; count: number }[]> {
    try {
      // TODO: Implement proper trending algorithm
      // For now, return mock data
      return [
        { tag: 'AICollaboration', count: 45 },
        { tag: 'Claude', count: 38 },
        { tag: 'ProductStrategy', count: 32 },
        { tag: 'OpenAI', count: 28 },
        { tag: 'Innovation', count: 25 }
      ];
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Get user's own posts
   */
  async getUserPosts(userId: string, limitCount: number = 10): Promise<FeedPost[]> {
    try {
      const q = query(
        collection(db, 'socialPosts'),
        where('authorId', '==', userId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const posts: FeedPost[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as SocialPostData;
        
        const feedPost: FeedPost = {
          id: docSnap.id,
          author: {
            id: data.authorId,
            name: data.authorName,
            title: data.authorTitle || '',
            company: data.authorCompany || '',
            avatar: data.authorAvatar || '',
            isVerified: false,
            isConnected: false
          },
          type: data.type,
          title: data.title,
          content: data.content,
          aiAgentsUsed: data.aiAgentsUsed,
          collaborationDuration: data.collaborationDuration,
          collaborationParticipants: data.collaborationParticipants,
          attachments: data.attachments,
          tags: data.tags,
          visibility: data.visibility,
          metrics: data.metrics,
          isLiked: false, // User can't like their own posts
          isBookmarked: false,
          isTrending: data.isTrending,
          createdAt: data.createdAt.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString()
        };

        posts.push(feedPost);
      }

      return posts;
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error getting user posts:', error);
      return [];
    }
  }

  /**
   * Delete a post (only by author)
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to delete posts');
      }

      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data() as SocialPostData;
      
      if (postData.authorId !== currentUser.uid) {
        throw new Error('Only the author can delete this post');
      }

      // Soft delete by setting isActive to false
      await updateDoc(postRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      console.log('🗑️ [SocialFeedFirebase] Post deleted:', postId);
    } catch (error) {
      console.error('❌ [SocialFeedFirebase] Error deleting post:', error);
      throw error;
    }
  }
}

export const socialFeedFirebaseService = new SocialFeedFirebaseService();

