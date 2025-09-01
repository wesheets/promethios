import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Add,
  TrendingUp,
  People,
  Public,
  SmartToy,
  Psychology,
  AutoAwesome,
  Clear,
} from '@mui/icons-material';
import SocialFeedPost, { FeedPost } from './SocialFeedPost';
import CreatePostDialog from './CreatePostDialog';
import { socialFeedService } from '../../services/SocialFeedService';
import { useUserInteractions } from '../../hooks/useUserInteractions';
import { useAuth } from '../../context/AuthContext';

interface FeedFilters {
  postTypes: string[];
  aiAgents: string[];
  timeRange: string;
  connectionLevel: string;
  trending: boolean;
}

interface SocialFeedProps {
  userId?: string;
  variant?: 'home' | 'profile' | 'following' | 'trending';
  onCreatePost?: () => void;
  onViewProfile?: (userId: string) => void;
  onStartCollaboration?: (userId: string) => void;
  onViewConversation?: (conversationId: string) => void;
}

const SocialFeed: React.FC<SocialFeedProps> = ({
  userId,
  variant = 'home',
  onCreatePost,
  onViewProfile,
  onStartCollaboration,
  onViewConversation,
}) => {
  // Hooks
  const { currentUser } = useAuth();
  const { sendInteraction } = useUserInteractions();
  
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Create post dialog
  const [showCreatePostDialog, setShowCreatePostDialog] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState<FeedFilters>({
    postTypes: [],
    aiAgents: [],
    timeRange: 'all',
    connectionLevel: 'all',
    trending: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  const tabs = [
    { label: 'For You', value: 'for_you', icon: <AutoAwesome /> },
    { label: 'Following', value: 'following', icon: <People /> },
    { label: 'Trending', value: 'trending', icon: <TrendingUp /> },
    { label: 'AI Showcase', value: 'ai_showcase', icon: <SmartToy /> },
    { label: 'Industry', value: 'industry', icon: <Psychology /> },
  ];

  const postTypes = [
    { value: 'collaboration_highlight', label: 'AI Collaboration Highlight' },
    { value: 'ai_showcase', label: 'AI Agent Showcase' },
    { value: 'professional_update', label: 'Professional Update' },
    { value: 'industry_insight', label: 'Industry Insight' },
    { value: 'connection_announcement', label: 'New Connection' },
  ];

  const aiAgentTypes = ['Claude', 'OpenAI', 'Gemini', 'Custom'];
  const timeRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const connectionLevels = [
    { value: 'all', label: 'All Connections' },
    { value: '1st', label: '1st Connections' },
    { value: '2nd', label: '2nd Connections' },
    { value: '3rd', label: '3rd+ Connections' },
  ];

  // Load posts
  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentPage = reset ? 1 : page;
      const feedType = tabs[activeTab]?.value || 'for_you';
      
      const result = await socialFeedService.getFeedPosts({
        feedType,
        userId,
        filters,
        page: currentPage,
        limit: 10,
      });
      
      if (reset) {
        setPosts(result.posts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...result.posts]);
        setPage(prev => prev + 1);
      }
      
      setHasMore(result.hasMore);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, userId, filters, page, loading]);

  // Initial load and tab changes
  useEffect(() => {
    loadPosts(true);
  }, [activeTab, filters]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000
      ) {
        if (hasMore && !loading) {
          loadPosts();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadPosts]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleRefresh = () => {
    loadPosts(true);
  };

  // Unified notification system handlers
  const handleLike = async (postId: string) => {
    try {
      console.log('👍 [SocialFeed] Handling like via unified system');
      
      // Find the post to get author info
      const post = posts.find(p => p.id === postId);
      if (!post || !currentUser?.uid) return;

      // Don't send notification to self
      if (post.author.id === currentUser.uid) return;

      // Send like notification via unified system
      await sendInteraction('post_like', post.author.id, {
        postId: postId,
        postTitle: post.title,
        message: `${currentUser.displayName || 'Someone'} liked your post: "${post.title}"`,
        priority: 'low'
      });

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                isLiked: !p.isLiked,
                metrics: {
                  ...p.metrics,
                  likes: p.isLiked ? p.metrics.likes - 1 : p.metrics.likes + 1
                }
              }
            : p
        )
      );

    } catch (error) {
      console.error('❌ [SocialFeed] Error handling like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    try {
      console.log('💬 [SocialFeed] Handling comment via unified system');
      
      // Find the post to get author info
      const post = posts.find(p => p.id === postId);
      if (!post || !currentUser?.uid) return;

      // Don't send notification to self
      if (post.author.id === currentUser.uid) return;

      // Send comment notification via unified system
      await sendInteraction('post_comment', post.author.id, {
        postId: postId,
        postTitle: post.title,
        message: `${currentUser.displayName || 'Someone'} commented on your post: "${post.title}"`,
        priority: 'medium'
      });

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                metrics: {
                  ...p.metrics,
                  comments: p.metrics.comments + 1
                }
              }
            : p
        )
      );

    } catch (error) {
      console.error('❌ [SocialFeed] Error handling comment:', error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      console.log('🔄 [SocialFeed] Handling share');
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(p => 
          p.id === postId 
            ? { 
                ...p, 
                metrics: {
                  ...p.metrics,
                  shares: p.metrics.shares + 1
                }
              }
            : p
        )
      );

    } catch (error) {
      console.error('❌ [SocialFeed] Error handling share:', error);
    }
  };

  const handlePostCreated = (newPost: FeedPost) => {
    console.log('📝 [SocialFeed] New post created:', newPost);
    
    // Add new post to the top of the feed
    setPosts(prevPosts => [newPost, ...prevPosts]);
    
    // Close dialog
    setShowCreatePostDialog(false);
  };

  const handleFilterChange = (key: keyof FeedFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      postTypes: [],
      aiAgents: [],
      timeRange: 'all',
      connectionLevel: 'all',
      trending: false,
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.postTypes.length > 0) count++;
    if (filters.aiAgents.length > 0) count++;
    if (filters.timeRange !== 'all') count++;
    if (filters.connectionLevel !== 'all') count++;
    if (filters.trending) count++;
    return count;
  };

  const handleLike = async (postId: string) => {
    try {
      await socialFeedService.likePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked,
              metrics: {
                ...post.metrics,
                likes: post.isLiked ? post.metrics.likes - 1 : post.metrics.likes + 1
              }
            }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (postId: string) => {
    // This would open a comment dialog or navigate to post detail
    console.log('Comment on post:', postId);
  };

  const handleShare = async (postId: string) => {
    try {
      await socialFeedService.sharePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              metrics: {
                ...post.metrics,
                shares: post.metrics.shares + 1
              }
            }
          : post
      ));
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ 
        mb: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              AI Collaboration Feed
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <Refresh />
              </IconButton>
              
              <IconButton
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                color={getActiveFilterCount() > 0 ? 'primary' : 'default'}
              >
                <FilterList />
                {getActiveFilterCount() > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                    }}
                  />
                )}
              </IconButton>
            </Box>
          </Box>
          
          {/* Active Filters */}
          {getActiveFilterCount() > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {filters.postTypes.map(type => (
                <Chip
                  key={type}
                  size="small"
                  label={postTypes.find(pt => pt.value === type)?.label}
                  onDelete={() => handleFilterChange('postTypes', filters.postTypes.filter(t => t !== type))}
                />
              ))}
              {filters.aiAgents.map(agent => (
                <Chip
                  key={agent}
                  size="small"
                  label={agent}
                  onDelete={() => handleFilterChange('aiAgents', filters.aiAgents.filter(a => a !== agent))}
                />
              ))}
              {filters.timeRange !== 'all' && (
                <Chip
                  size="small"
                  label={timeRanges.find(tr => tr.value === filters.timeRange)?.label}
                  onDelete={() => handleFilterChange('timeRange', 'all')}
                />
              )}
              {filters.connectionLevel !== 'all' && (
                <Chip
                  size="small"
                  label={connectionLevels.find(cl => cl.value === filters.connectionLevel)?.label}
                  onDelete={() => handleFilterChange('connectionLevel', 'all')}
                />
              )}
              {filters.trending && (
                <Chip
                  size="small"
                  label="Trending"
                  onDelete={() => handleFilterChange('trending', false)}
                />
              )}
              <Button size="small" startIcon={<Clear />} onClick={handleClearFilters}>
                Clear All
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderTop: 1, borderColor: 'divider' }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.value}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{ minHeight: 48 }}
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Posts */}
      <Box>
        {posts.map((post) => (
          <SocialFeedPost
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onViewProfile={onViewProfile}
            onStartCollaboration={onStartCollaboration}
            onViewConversation={onViewConversation}
          />
        ))}
        
        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}
        
        {/* No more posts */}
        {!loading && !hasMore && posts.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              You've reached the end of the feed
            </Typography>
          </Box>
        )}
        
        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <Paper sx={{ 
            p: 6, 
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Be the first to share your AI collaboration experience!
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreatePostDialog(true)}>
              Create Post
            </Button>
          </Paper>
        )}
      </Box>
      
      {/* Create Post FAB */}
      {onCreatePost && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setShowCreatePostDialog(true)}
        >
          <Add />
        </Fab>
      )}
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{ sx: { width: 300, maxHeight: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
          
          {/* Post Types */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={postTypes}
              getOptionLabel={(option) => option.label}
              value={postTypes.filter(pt => filters.postTypes.includes(pt.value))}
              onChange={(_, value) => handleFilterChange('postTypes', value.map(v => v.value))}
              renderInput={(params) => (
                <TextField {...params} label="Post Types" size="small" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option.label}
                    size="small"
                    {...getTagProps({ index })}
                    key={option.value}
                  />
                ))
              }
            />
          </FormControl>
          
          {/* AI Agents */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <Autocomplete
              multiple
              options={aiAgentTypes}
              value={filters.aiAgents}
              onChange={(_, value) => handleFilterChange('aiAgents', value)}
              renderInput={(params) => (
                <TextField {...params} label="AI Agents" size="small" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </FormControl>
          
          {/* Time Range */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel size="small">Time Range</InputLabel>
            <Select
              size="small"
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value)}
              label="Time Range"
            >
              {timeRanges.map(range => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Connection Level */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel size="small">Connection Level</InputLabel>
            <Select
              size="small"
              value={filters.connectionLevel}
              onChange={(e) => handleFilterChange('connectionLevel', e.target.value)}
              label="Connection Level"
            >
              {connectionLevels.map(level => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={handleClearFilters}>
              Clear All
            </Button>
            <Button size="small" onClick={() => setFilterAnchorEl(null)}>
              Apply
            </Button>
          </Box>
        </Box>
      </Menu>
      
      {/* Create Post Dialog */}
      <CreatePostDialog
        open={showCreatePostDialog}
        onClose={() => setShowCreatePostDialog(false)}
        onPostCreated={handlePostCreated}
      />
    </Box>
  );
};

export default SocialFeed;

