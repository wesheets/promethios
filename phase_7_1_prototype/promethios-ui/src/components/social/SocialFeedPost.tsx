import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Badge,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  Comment,
  Share,
  MoreVert,
  SmartToy,
  Psychology,
  AutoAwesome,
  Visibility,
  Public,
  People,
  Lock,
  Star,
  TrendingUp,
  Schedule,
  PlayArrow,
  GetApp,
} from '@mui/icons-material';

export interface AIAgent {
  id: string;
  name: string;
  type: 'Claude' | 'OpenAI' | 'Gemini' | 'Custom';
  color: string;
}

export interface FeedPostAuthor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  isVerified: boolean;
  isConnected: boolean;
}

export interface FeedPostMetrics {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  collaborationRating?: number;
}

export interface FeedPost {
  id: string;
  author: FeedPostAuthor;
  type: 'collaboration_highlight' | 'ai_showcase' | 'professional_update' | 'industry_insight' | 'connection_announcement';
  title: string;
  content: string;
  aiAgentsUsed?: AIAgent[];
  collaborationDuration?: number; // in minutes
  collaborationParticipants?: string[];
  attachments?: {
    type: 'conversation' | 'document' | 'image' | 'video';
    url: string;
    title: string;
    thumbnail?: string;
  }[];
  tags: string[];
  visibility: 'public' | 'connections' | 'private';
  metrics: FeedPostMetrics;
  isLiked: boolean;
  isBookmarked: boolean;
  isTrending: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface SocialFeedPostProps {
  post: FeedPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onViewProfile?: (userId: string) => void;
  onStartCollaboration?: (userId: string) => void;
  onViewConversation?: (conversationId: string) => void;
  showActions?: boolean;
}

const SocialFeedPost: React.FC<SocialFeedPostProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onViewProfile,
  onStartCollaboration,
  onViewConversation,
  showActions = true,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);

  const getPostTypeIcon = () => {
    switch (post.type) {
      case 'collaboration_highlight':
        return <AutoAwesome sx={{ color: '#FF6B35' }} />;
      case 'ai_showcase':
        return <SmartToy sx={{ color: '#00A67E' }} />;
      case 'professional_update':
        return <TrendingUp sx={{ color: '#1976D2' }} />;
      case 'industry_insight':
        return <Psychology sx={{ color: '#9C27B0' }} />;
      case 'connection_announcement':
        return <People sx={{ color: '#4CAF50' }} />;
      default:
        return <AutoAwesome />;
    }
  };

  const getPostTypeLabel = () => {
    switch (post.type) {
      case 'collaboration_highlight':
        return 'AI Collaboration Highlight';
      case 'ai_showcase':
        return 'AI Agent Showcase';
      case 'professional_update':
        return 'Professional Update';
      case 'industry_insight':
        return 'Industry Insight';
      case 'connection_announcement':
        return 'New Connection';
      default:
        return 'Post';
    }
  };

  const getVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <Public fontSize="small" />;
      case 'connections':
        return <People fontSize="small" />;
      case 'private':
        return <Lock fontSize="small" />;
    }
  };

  const getAIAgentColor = (type: string) => {
    switch (type) {
      case 'Claude': return '#FF6B35';
      case 'OpenAI': return '#00A67E';
      case 'Gemini': return '#4285F4';
      default: return '#9C27B0';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLike = () => {
    onLike?.(post.id);
  };

  const handleComment = () => {
    setShowCommentDialog(true);
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      onComment?.(post.id);
      setCommentText('');
      setShowCommentDialog(false);
    }
  };

  return (
    <>
      <Card sx={{ 
        mb: 2, 
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }
      }}>
        {post.isTrending && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #FF6B35, #00A67E, #4285F4)',
            }}
          />
        )}
        
        <CardContent sx={{ pb: 1 }}>
          {/* Post Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                post.author.isVerified ? (
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: '#1976D2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                    }}
                  >
                    <Star sx={{ fontSize: 10, color: 'white' }} />
                  </Box>
                ) : null
              }
            >
              <Avatar
                src={post.author.avatar}
                sx={{ width: 48, height: 48, cursor: 'pointer' }}
                onClick={() => onViewProfile?.(post.author.id)}
              >
                {post.author.name.charAt(0)}
              </Avatar>
            </Badge>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, cursor: 'pointer' }}
                  onClick={() => onViewProfile?.(post.author.id)}
                >
                  {post.author.name}
                </Typography>
                {post.author.isConnected && (
                  <Chip size="small" label="1st" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {post.author.title} at {post.author.company}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getPostTypeIcon()}
                  <Typography variant="caption" color="text.secondary">
                    {getPostTypeLabel()}
                  </Typography>
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(post.createdAt)}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  •
                </Typography>
                
                <Tooltip title={`Visible to ${post.visibility}`}>
                  {getVisibilityIcon()}
                </Tooltip>
                
                {post.isTrending && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      •
                    </Typography>
                    <Chip
                      size="small"
                      icon={<TrendingUp />}
                      label="Trending"
                      color="warning"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </>
                )}
              </Box>
            </Box>
            
            <IconButton size="small" onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>
          
          {/* Post Content */}
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
            {post.title}
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {post.content}
          </Typography>
          
          {/* AI Agents Used */}
          {post.aiAgentsUsed && post.aiAgentsUsed.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy fontSize="small" />
                AI Agents Used:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {post.aiAgentsUsed.map((agent) => (
                  <Chip
                    key={agent.id}
                    size="small"
                    icon={<SmartToy />}
                    label={`${agent.type} - ${agent.name}`}
                    sx={{
                      backgroundColor: getAIAgentColor(agent.type),
                      color: 'white',
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Collaboration Details */}
          {(post.collaborationDuration || post.collaborationParticipants) && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#f5f5f5', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Collaboration Details:
              </Typography>
              <Box sx={{ display: 'flex', gap: 3 }}>
                {post.collaborationDuration && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" color="action" />
                    <Typography variant="caption">
                      Duration: {formatDuration(post.collaborationDuration)}
                    </Typography>
                  </Box>
                )}
                {post.collaborationParticipants && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <People fontSize="small" color="action" />
                    <Typography variant="caption">
                      {post.collaborationParticipants.length} participants
                    </Typography>
                  </Box>
                )}
                {post.metrics.collaborationRating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star fontSize="small" color="action" />
                    <Typography variant="caption">
                      {post.metrics.collaborationRating.toFixed(1)}/5.0
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
          
          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {post.attachments.map((attachment, index) => (
                <Card key={index} variant="outlined" sx={{ 
                  mb: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {attachment.thumbnail ? (
                        <Box
                          component="img"
                          src={attachment.thumbnail}
                          sx={{ width: 60, height: 60, borderRadius: 1, objectFit: 'cover' }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: 1,
                            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {attachment.type === 'conversation' && <AutoAwesome />}
                          {attachment.type === 'document' && <GetApp />}
                          {attachment.type === 'video' && <PlayArrow />}
                        </Box>
                      )}
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">{attachment.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {attachment.type.replace('_', ' ')}
                        </Typography>
                      </Box>
                      
                      {attachment.type === 'conversation' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={() => onViewConversation?.(attachment.url)}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
          
          {/* Tags */}
          {post.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {post.tags.map((tag) => (
                <Chip
                  key={tag}
                  size="small"
                  label={`#${tag}`}
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
          
          {/* Metrics */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {post.metrics.likes > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {post.metrics.likes} {post.metrics.likes === 1 ? 'like' : 'likes'}
                </Typography>
              )}
              {post.metrics.comments > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {post.metrics.comments} {post.metrics.comments === 1 ? 'comment' : 'comments'}
                </Typography>
              )}
              {post.metrics.shares > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {post.metrics.shares} {post.metrics.shares === 1 ? 'share' : 'shares'}
                </Typography>
              )}
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              {post.metrics.views} views
            </Typography>
          </Box>
        </CardContent>
        
        {showActions && (
          <>
            <Divider />
            <CardActions sx={{ px: 2, py: 1 }}>
              <Button
                startIcon={post.isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                onClick={handleLike}
                color={post.isLiked ? 'primary' : 'inherit'}
                sx={{ flex: 1 }}
              >
                Like
              </Button>
              
              <Button
                startIcon={<Comment />}
                onClick={handleComment}
                sx={{ flex: 1 }}
              >
                Comment
              </Button>
              
              <Button
                startIcon={<Share />}
                onClick={handleShare}
                sx={{ flex: 1 }}
              >
                Share
              </Button>
              
              {post.type === 'collaboration_highlight' && (
                <Button
                  startIcon={<AutoAwesome />}
                  onClick={() => onStartCollaboration?.(post.author.id)}
                  variant="outlined"
                  size="small"
                >
                  Collaborate
                </Button>
              )}
            </CardActions>
          </>
        )}
      </Card>
      
      {/* Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Save post</MenuItem>
        <MenuItem onClick={handleMenuClose}>Copy link</MenuItem>
        <MenuItem onClick={handleMenuClose}>Report post</MenuItem>
        <MenuItem onClick={handleMenuClose}>Unfollow {post.author.name}</MenuItem>
      </Menu>
      
      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onClose={() => setShowCommentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add a comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Share your thoughts on this AI collaboration..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCommentDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitComment} variant="contained" disabled={!commentText.trim()}>
            Post Comment
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share this post</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this AI collaboration highlight with your network
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button variant="outlined" fullWidth>Share to LinkedIn</Button>
            <Button variant="outlined" fullWidth>Share to Twitter</Button>
            <Button variant="outlined" fullWidth>Copy link</Button>
            <Button variant="outlined" fullWidth>Send via message</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowShareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SocialFeedPost;

