/**
 * Comment Section Component
 * 
 * Displays threaded comments for social feed posts with real-time updates,
 * like functionality, and reply capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Divider,
  Stack,
  Paper,
  Collapse,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Send,
  ThumbUp,
  ThumbUpOutlined,
  Reply,
  MoreVert,
  Edit,
  Delete,
  ExpandMore,
  ExpandLess,
  Close
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { socialCommentsService, SocialComment, CommentThread } from '../../services/SocialCommentsService';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  initialCommentCount?: number;
  onCommentCountChange?: (count: number) => void;
}

interface CommentItemProps {
  comment: SocialComment;
  replies: SocialComment[];
  hasMoreReplies: boolean;
  isReply?: boolean;
  onReply: (commentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  replies,
  hasMoreReplies,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  onLike
}) => {
  const { currentUser } = useAuth();
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiking, setIsLiking] = useState(false);

  // Check if user has liked this comment
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (currentUser?.uid && comment.id) {
        const liked = await socialCommentsService.hasUserLikedComment(comment.id, currentUser.uid);
        setIsLiked(liked);
      }
    };
    checkLikeStatus();
  }, [comment.id, currentUser?.uid]);

  const handleLike = async () => {
    if (!comment.id || isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await socialCommentsService.toggleCommentLike(comment.id);
      setIsLiked(result.isLiked);
      setLikeCount(result.newLikeCount);
      onLike(comment.id);
    } catch (error) {
      console.error('Error liking comment:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!comment.id) return;
    
    try {
      await socialCommentsService.editComment(comment.id, editContent);
      setIsEditing(false);
      onEdit(comment.id, editContent);
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!comment.id) return;
    
    try {
      await socialCommentsService.deleteComment(comment.id);
      onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
    setMenuAnchor(null);
  };

  const isOwnComment = currentUser?.uid === comment.authorId;
  const timeAgo = comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : '';

  return (
    <Box sx={{ mb: isReply ? 1 : 2 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Avatar
          src={comment.authorAvatar}
          alt={comment.authorName}
          sx={{ width: isReply ? 32 : 40, height: isReply ? 32 : 40 }}
        >
          {comment.authorName.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: isReply ? 'grey.50' : 'background.paper',
              borderRadius: 2
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="600">
                    {comment.authorName}
                  </Typography>
                  {comment.authorTitle && (
                    <Typography variant="caption" color="text.secondary">
                      {comment.authorTitle}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo}
                  </Typography>
                  {comment.isEdited && (
                    <Chip label="edited" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.7rem' }} />
                  )}
                </Stack>
                
                {isEditing ? (
                  <Stack spacing={1}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      variant="outlined"
                      size="small"
                    />
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={handleEdit} disabled={!editContent.trim()}>
                        Save
                      </Button>
                      <Button size="small" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                )}
              </Box>
              
              {isOwnComment && !isEditing && (
                <IconButton
                  size="small"
                  onClick={(e) => setMenuAnchor(e.currentTarget)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Paper>
          
          {/* Comment Actions */}
          {!isEditing && (
            <Stack direction="row" spacing={2} sx={{ mt: 0.5, ml: 1 }}>
              <Button
                size="small"
                startIcon={isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                onClick={handleLike}
                disabled={isLiking}
                sx={{
                  minWidth: 'auto',
                  color: isLiked ? 'primary.main' : 'text.secondary',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                {likeCount > 0 && likeCount}
              </Button>
              
              {!isReply && (
                <Button
                  size="small"
                  startIcon={<Reply />}
                  onClick={() => onReply(comment.id!)}
                  sx={{
                    minWidth: 'auto',
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  Reply
                </Button>
              )}
            </Stack>
          )}
          
          {/* Replies */}
          {!isReply && replies.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                startIcon={showReplies ? <ExpandLess /> : <ExpandMore />}
                onClick={() => setShowReplies(!showReplies)}
                sx={{ color: 'text.secondary', mb: 1 }}
              >
                {showReplies ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </Button>
              
              <Collapse in={showReplies}>
                <Stack spacing={1} sx={{ ml: 2, borderLeft: '2px solid', borderColor: 'divider', pl: 2 }}>
                  {replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      replies={[]}
                      hasMoreReplies={false}
                      isReply={true}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onLike={onLike}
                    />
                  ))}
                  {hasMoreReplies && (
                    <Button size="small" sx={{ alignSelf: 'flex-start' }}>
                      Load more replies
                    </Button>
                  )}
                </Stack>
              </Collapse>
            </Box>
          )}
        </Box>
      </Stack>
      
      {/* Comment Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setIsEditing(true); setMenuAnchor(null); }}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postAuthorId,
  initialCommentCount = 0,
  onCommentCountChange
}) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<CommentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);

  // Load comments
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const commentThreads = await socialCommentsService.getPostComments(postId);
      setComments(commentThreads);
      
      // Update comment count
      const totalComments = commentThreads.reduce((total, thread) => 
        total + 1 + thread.replies.length, 0
      );
      onCommentCountChange?.(totalComments);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId, onCommentCountChange]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = socialCommentsService.subscribeToPostComments(postId, (updatedComments) => {
      setComments(updatedComments);
      
      // Update comment count
      const totalComments = updatedComments.reduce((total, thread) => 
        total + 1 + thread.replies.length, 0
      );
      onCommentCountChange?.(totalComments);
    });

    return unsubscribe;
  }, [postId, onCommentCountChange]);

  // Initial load
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      await socialCommentsService.createComment({
        postId,
        content: newComment.trim()
      });
      
      setNewComment('');
      // Real-time updates will handle the UI update
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to create comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !replyingTo || submitting) return;
    
    setSubmitting(true);
    try {
      await socialCommentsService.createComment({
        postId,
        content: replyContent.trim(),
        parentCommentId: replyingTo
      });
      
      setReplyContent('');
      setReplyingTo(null);
      setShowReplyDialog(false);
      // Real-time updates will handle the UI update
    } catch (err) {
      console.error('Error creating reply:', err);
      setError('Failed to create reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowReplyDialog(true);
  };

  const handleEdit = (commentId: string, content: string) => {
    // Optimistically update the UI
    setComments(prevComments => 
      prevComments.map(thread => ({
        ...thread,
        comment: thread.comment.id === commentId 
          ? { ...thread.comment, content, isEdited: true }
          : thread.comment,
        replies: thread.replies.map(reply => 
          reply.id === commentId 
            ? { ...reply, content, isEdited: true }
            : reply
        )
      }))
    );
  };

  const handleDelete = (commentId: string) => {
    // Remove from UI immediately
    setComments(prevComments => 
      prevComments.filter(thread => {
        if (thread.comment.id === commentId) return false;
        thread.replies = thread.replies.filter(reply => reply.id !== commentId);
        return true;
      })
    );
  };

  const handleLike = (commentId: string) => {
    // Like status is handled within CommentItem component
    console.log('Comment liked:', commentId);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* New Comment Input */}
      {currentUser && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Avatar src={currentUser.photoURL || ''} sx={{ width: 40, height: 40 }}>
              {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Posting...' : 'Comment'}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}
      
      {/* Comments List */}
      <Stack spacing={2}>
        {comments.map((thread) => (
          <CommentItem
            key={thread.comment.id}
            comment={thread.comment}
            replies={thread.replies}
            hasMoreReplies={thread.hasMoreReplies}
            onReply={handleReply}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onLike={handleLike}
          />
        ))}
        
        {comments.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            No comments yet. Be the first to comment!
          </Typography>
        )}
      </Stack>
      
      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onClose={() => setShowReplyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Reply to Comment
          <IconButton
            onClick={() => setShowReplyDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitReply}
            disabled={!replyContent.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          >
            {submitting ? 'Replying...' : 'Reply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentSection;

