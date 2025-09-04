/**
 * Social Comments Service
 * 
 * Handles all comment-related operations for the social feed including
 * threaded comments, replies, and real-time updates.
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
  onSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/config';
import { FirebaseProfileService } from './FirebaseProfileService';
import { UnifiedNotificationService } from './UnifiedNotificationService';

export interface SocialComment {
  id?: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorTitle?: string;
  
  content: string;
  parentCommentId?: string; // For threaded replies
  
  // Engagement
  likes: number;
  replies: number;
  
  // Status
  isActive: boolean;
  isEdited: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CommentThread {
  comment: SocialComment;
  replies: SocialComment[];
  hasMoreReplies: boolean;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export interface CommentLike {
  id?: string;
  commentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp;
}

class SocialCommentsService {
  private profileService = new FirebaseProfileService();
  private notificationService = UnifiedNotificationService.getInstance();

  /**
   * Create a new comment
   */
  async createComment(commentData: CreateCommentRequest): Promise<string> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to create comments');
      }

      // Get user profile for author information
      const userProfile = await this.profileService.getUserProfile(currentUser.uid);
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Create comment document
      const commentRef = doc(collection(db, 'socialComments'));
      const commentId = commentRef.id;

      const comment: SocialComment = {
        id: commentId,
        postId: commentData.postId,
        authorId: currentUser.uid,
        authorName: userProfile.name || userProfile.displayName || 'Unknown User',
        authorAvatar: userProfile.avatar || currentUser.photoURL || '',
        authorTitle: userProfile.title || '',
        
        content: commentData.content.trim(),
        parentCommentId: commentData.parentCommentId,
        
        likes: 0,
        replies: 0,
        
        isActive: true,
        isEdited: false,
        
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      await setDoc(commentRef, comment);

      // Update post comment count
      const postRef = doc(db, 'socialPosts', commentData.postId);
      await updateDoc(postRef, {
        'metrics.comments': increment(1),
        updatedAt: serverTimestamp()
      });

      // Update parent comment reply count if this is a reply
      if (commentData.parentCommentId) {
        const parentCommentRef = doc(db, 'socialComments', commentData.parentCommentId);
        await updateDoc(parentCommentRef, {
          replies: increment(1),
          updatedAt: serverTimestamp()
        });
      }

      // Send notification to post author (and parent comment author if reply)
      await this.sendCommentNotifications(commentData.postId, commentId, commentData.parentCommentId);

      console.log('✅ [SocialCommentsService] Comment created successfully:', commentId);
      return commentId;
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post with threading
   */
  async getPostComments(postId: string, limitCount: number = 20): Promise<CommentThread[]> {
    try {
      console.log('📖 [SocialCommentsService] Loading comments for post:', postId);

      // Get top-level comments (no parent)
      const topLevelQuery = query(
        collection(db, 'socialComments'),
        where('postId', '==', postId),
        where('parentCommentId', '==', null),
        where('isActive', '==', true),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const topLevelSnapshot = await getDocs(topLevelQuery);
      const commentThreads: CommentThread[] = [];

      // For each top-level comment, get its replies
      for (const docSnap of topLevelSnapshot.docs) {
        const comment = { id: docSnap.id, ...docSnap.data() } as SocialComment;
        
        // Get replies for this comment
        const repliesQuery = query(
          collection(db, 'socialComments'),
          where('parentCommentId', '==', comment.id),
          where('isActive', '==', true),
          orderBy('createdAt', 'asc'),
          limit(5) // Limit initial replies shown
        );

        const repliesSnapshot = await getDocs(repliesQuery);
        const replies = repliesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SocialComment[];

        commentThreads.push({
          comment,
          replies,
          hasMoreReplies: replies.length === 5 // If we got the limit, there might be more
        });
      }

      console.log(`✅ [SocialCommentsService] Loaded ${commentThreads.length} comment threads`);
      return commentThreads;
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error loading comments:', error);
      return [];
    }
  }

  /**
   * Get more replies for a specific comment
   */
  async getCommentReplies(commentId: string, limitCount: number = 10): Promise<SocialComment[]> {
    try {
      const repliesQuery = query(
        collection(db, 'socialComments'),
        where('parentCommentId', '==', commentId),
        where('isActive', '==', true),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );

      const repliesSnapshot = await getDocs(repliesQuery);
      const replies = repliesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SocialComment[];

      return replies;
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error loading replies:', error);
      return [];
    }
  }

  /**
   * Like or unlike a comment
   */
  async toggleCommentLike(commentId: string): Promise<{ isLiked: boolean; newLikeCount: number }> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to like comments');
      }

      const userId = currentUser.uid;
      const likeId = `${commentId}_${userId}`;
      const likeRef = doc(db, 'socialCommentLikes', likeId);
      const commentRef = doc(db, 'socialComments', commentId);

      // Check if like already exists
      const likeDoc = await getDoc(likeRef);
      const isCurrentlyLiked = likeDoc.exists();

      if (isCurrentlyLiked) {
        // Unlike: Remove like and decrement counter
        await deleteDoc(likeRef);
        await updateDoc(commentRef, {
          likes: increment(-1),
          updatedAt: serverTimestamp()
        });

        console.log('👎 [SocialCommentsService] Comment unliked:', commentId);
        
        // Get updated like count
        const updatedComment = await getDoc(commentRef);
        const newLikeCount = updatedComment.data()?.likes || 0;
        
        return { isLiked: false, newLikeCount };
      } else {
        // Like: Add like and increment counter
        const userProfile = await this.profileService.getUserProfile(userId);
        
        const likeData: CommentLike = {
          id: likeId,
          commentId,
          userId,
          userName: userProfile?.name || userProfile?.displayName || 'Unknown User',
          userAvatar: userProfile?.avatar || currentUser.photoURL || '',
          createdAt: serverTimestamp() as Timestamp
        };

        await setDoc(likeRef, likeData);
        await updateDoc(commentRef, {
          likes: increment(1),
          updatedAt: serverTimestamp()
        });

        console.log('👍 [SocialCommentsService] Comment liked:', commentId);

        // Send notification to comment author
        const commentDoc = await getDoc(commentRef);
        const commentData = commentDoc.data() as SocialComment;
        
        if (commentData.authorId !== userId) {
          // TODO: Send comment like notification
          console.log('🔔 [SocialCommentsService] Would send comment like notification');
        }

        // Get updated like count
        const updatedComment = await getDoc(commentRef);
        const newLikeCount = updatedComment.data()?.likes || 1;
        
        return { isLiked: true, newLikeCount };
      }
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error toggling comment like:', error);
      throw error;
    }
  }

  /**
   * Edit a comment (only by author)
   */
  async editComment(commentId: string, newContent: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to edit comments');
      }

      const commentRef = doc(db, 'socialComments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data() as SocialComment;
      
      if (commentData.authorId !== currentUser.uid) {
        throw new Error('Only the author can edit this comment');
      }

      await updateDoc(commentRef, {
        content: newContent.trim(),
        isEdited: true,
        updatedAt: serverTimestamp()
      });

      console.log('✏️ [SocialCommentsService] Comment edited:', commentId);
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error editing comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (only by author)
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User must be authenticated to delete comments');
      }

      const commentRef = doc(db, 'socialComments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        throw new Error('Comment not found');
      }

      const commentData = commentDoc.data() as SocialComment;
      
      if (commentData.authorId !== currentUser.uid) {
        throw new Error('Only the author can delete this comment');
      }

      // Soft delete by setting isActive to false
      await updateDoc(commentRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      // Update post comment count
      const postRef = doc(db, 'socialPosts', commentData.postId);
      await updateDoc(postRef, {
        'metrics.comments': increment(-1),
        updatedAt: serverTimestamp()
      });

      // Update parent comment reply count if this was a reply
      if (commentData.parentCommentId) {
        const parentCommentRef = doc(db, 'socialComments', commentData.parentCommentId);
        await updateDoc(parentCommentRef, {
          replies: increment(-1),
          updatedAt: serverTimestamp()
        });
      }

      console.log('🗑️ [SocialCommentsService] Comment deleted:', commentId);
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Check if user has liked a comment
   */
  async hasUserLikedComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${commentId}_${userId}`;
      const likeRef = doc(db, 'socialCommentLikes', likeId);
      const likeDoc = await getDoc(likeRef);
      return likeDoc.exists();
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error checking comment like status:', error);
      return false;
    }
  }

  /**
   * Send notifications for new comments
   */
  private async sendCommentNotifications(postId: string, commentId: string, parentCommentId?: string): Promise<void> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Get post data to notify post author
      const postRef = doc(db, 'socialPosts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const postData = postDoc.data();
        
        // Notify post author (if not commenting on own post)
        if (postData.authorId !== currentUser.uid) {
          await this.notificationService.sendSocialNotification(
            'post_comment',
            currentUser.uid,
            postData.authorId,
            postId,
            postData.title
          );
        }
      }

      // If this is a reply, notify the parent comment author
      if (parentCommentId) {
        const parentCommentRef = doc(db, 'socialComments', parentCommentId);
        const parentCommentDoc = await getDoc(parentCommentRef);
        
        if (parentCommentDoc.exists()) {
          const parentCommentData = parentCommentDoc.data();
          
          // Notify parent comment author (if not replying to own comment)
          if (parentCommentData.authorId !== currentUser.uid) {
            await this.notificationService.sendSocialNotification(
              'comment_reply',
              currentUser.uid,
              parentCommentData.authorId,
              postId,
              postDoc.data()?.title || 'a post',
              { parentCommentId, commentId }
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ [SocialCommentsService] Error sending comment notifications:', error);
    }
  }

  /**
   * Subscribe to real-time comment updates for a post
   */
  subscribeToPostComments(postId: string, callback: (comments: CommentThread[]) => void): () => void {
    const q = query(
      collection(db, 'socialComments'),
      where('postId', '==', postId),
      where('isActive', '==', true),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
      try {
        // Group comments by parent/child relationship
        const allComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SocialComment[];

        const topLevelComments = allComments.filter(comment => !comment.parentCommentId);
        const commentThreads: CommentThread[] = [];

        for (const comment of topLevelComments) {
          const replies = allComments.filter(c => c.parentCommentId === comment.id);
          commentThreads.push({
            comment,
            replies,
            hasMoreReplies: false // Real-time updates show all replies
          });
        }

        callback(commentThreads);
      } catch (error) {
        console.error('❌ [SocialCommentsService] Error in real-time comment updates:', error);
      }
    });
  }
}

export const socialCommentsService = new SocialCommentsService();

