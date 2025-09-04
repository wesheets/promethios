/**
 * SocialFeedService
 * 
 * Service for managing social feed posts, interactions, and content
 * in the Promethios AI collaboration platform.
 * 
 * Now uses Firebase for real data persistence and user integration.
 */

import { FeedPost, FeedPostAuthor, FeedPostMetrics } from '../components/social/SocialFeedPost';
import { socialFeedFirebaseService } from './SocialFeedFirebaseService';

export interface FeedFilters {
  postTypes: string[];
  aiAgents: string[];
  timeRange: string;
  connectionLevel: string;
  trending: boolean;
}

export interface FeedRequest {
  feedType: string;
  userId?: string;
  filters: FeedFilters;
  page: number;
  limit: number;
}

export interface FeedResponse {
  posts: FeedPost[];
  hasMore: boolean;
  totalCount: number;
  nextPage?: number;
}

export interface CreatePostRequest {
  type: string;
  title: string;
  content: string;
  tags: string[];
  visibility: string;
  aiAgentsUsed?: string[];
  collaborationDuration?: number;
  collaborationParticipants?: string[];
  attachments?: any[];
}

class SocialFeedService {
  private firebaseService = socialFeedFirebaseService;

  /**
   * Get feed posts from Firebase
   */
  async getFeedPosts(request: FeedRequest): Promise<FeedResponse> {
    try {
      console.log('📖 [SocialFeedService] Loading posts from Firebase');
      
      const result = await this.firebaseService.getFeedPosts({
        ...request,
        lastDoc: undefined // TODO: Implement proper pagination
      });

      return {
        posts: result.posts,
        hasMore: result.hasMore,
        totalCount: result.totalCount,
        nextPage: result.hasMore ? request.page + 1 : undefined
      };
    } catch (error) {
      console.error('❌ [SocialFeedService] Error loading posts:', error);
      
      // Fallback to empty feed on error
      return {
        posts: [],
        hasMore: false,
        totalCount: 0
      };
    }
  }

  /**
   * Like or unlike a post
   */
  async likePost(postId: string): Promise<void> {
    try {
      console.log('👍 [SocialFeedService] Toggling like for post:', postId);
      await this.firebaseService.toggleLike(postId);
    } catch (error) {
      console.error('❌ [SocialFeedService] Error liking post:', error);
      throw error;
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string): Promise<void> {
    try {
      console.log('🔄 [SocialFeedService] Sharing post:', postId);
      // TODO: Implement share functionality
      console.log('⚠️ [SocialFeedService] Share functionality not yet implemented');
    } catch (error) {
      console.error('❌ [SocialFeedService] Error sharing post:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostRequest): Promise<FeedPost> {
    try {
      console.log('✍️ [SocialFeedService] Creating new post');
      
      // Convert CreatePostRequest to Firebase format
      const firebasePostData = {
        type: postData.type as any,
        title: postData.title,
        content: postData.content,
        tags: postData.tags,
        visibility: postData.visibility as any,
        aiAgentsUsed: postData.aiAgentsUsed?.map(agentType => ({
          id: `${agentType.toLowerCase()}-${Date.now()}`,
          name: `${agentType} Assistant`,
          type: agentType as any,
          color: this.getAIAgentColor(agentType),
        })),
        collaborationDuration: postData.collaborationDuration,
        collaborationParticipants: postData.collaborationParticipants,
        attachments: postData.attachments,
        isTrending: false
      };

      const postId = await this.firebaseService.createPost(firebasePostData);
      
      // Get the created post to return
      const result = await this.firebaseService.getFeedPosts({
        feedType: 'for_you',
        filters: { postTypes: [], aiAgents: [], timeRange: 'all', connectionLevel: 'all', trending: false },
        page: 1,
        limit: 1
      });

      const createdPost = result.posts.find(p => p.id === postId);
      
      if (!createdPost) {
        throw new Error('Failed to retrieve created post');
      }

      console.log('✅ [SocialFeedService] Post created successfully:', postId);
      return createdPost;
    } catch (error) {
      console.error('❌ [SocialFeedService] Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get trending topics and hashtags
   */
  async getTrendingTopics(): Promise<{ tag: string; count: number }[]> {
    try {
      return await this.firebaseService.getTrendingTopics();
    } catch (error) {
      console.error('❌ [SocialFeedService] Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string): Promise<FeedPost[]> {
    try {
      return await this.firebaseService.getUserPosts(userId);
    } catch (error) {
      console.error('❌ [SocialFeedService] Error getting user posts:', error);
      return [];
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.firebaseService.deletePost(postId);
    } catch (error) {
      console.error('❌ [SocialFeedService] Error deleting post:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(postId: string): Promise<void> {
    try {
      await this.firebaseService.incrementViewCount(postId);
    } catch (error) {
      console.error('❌ [SocialFeedService] Error incrementing view count:', error);
    }
  }

  /**
   * Update user's feed preferences
   */
  async updateFeedPreferences(userId: string, preferences: any): Promise<void> {
    try {
      console.log('⚙️ [SocialFeedService] Updating feed preferences for user:', userId);
      // TODO: Implement feed preferences storage
      console.log('⚠️ [SocialFeedService] Feed preferences not yet implemented');
    } catch (error) {
      console.error('❌ [SocialFeedService] Error updating feed preferences:', error);
    }
  }

  /**
   * Get AI agent color by type
   */
  private getAIAgentColor(type: string): string {
    switch (type) {
      case 'Claude': return '#FF6B35';
      case 'OpenAI': return '#00A67E';
      case 'Gemini': return '#4285F4';
      default: return '#9C27B0';
    }
  }
}

export const socialFeedService = new SocialFeedService();

