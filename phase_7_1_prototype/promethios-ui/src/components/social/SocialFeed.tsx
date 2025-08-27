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
import { socialFeedService } from '../../services/SocialFeedService';

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
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
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
  
  // Create post dialog
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'collaboration_highlight',
    title: '',
    content: '',
    tags: [] as string[],
    visibility: 'public',
  });

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

  const handleCreatePost = async () => {
    try {
      const createdPost = await socialFeedService.createPost(newPost);
      setPosts(prev => [createdPost, ...prev]);
      setShowCreatePost(false);
      setNewPost({
        type: 'collaboration_highlight',
        title: '',
        content: '',
        tags: [],
        visibility: 'public',
      });
    } catch (err) {
      console.error('Error creating post:', err);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ 
        mb: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
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
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Be the first to share your AI collaboration experience!
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreatePost(true)}>
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
          onClick={() => setShowCreatePost(true)}
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
      <Dialog open={showCreatePost} onClose={() => setShowCreatePost(false)} maxWidth="md" fullWidth>
        <DialogTitle>Share Your AI Collaboration</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Post Type</InputLabel>
              <Select
                value={newPost.type}
                onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value }))}
                label="Post Type"
              >
                {postTypes.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Title"
              value={newPost.title}
              onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What did you accomplish with AI?"
            />
            
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share details about your AI collaboration experience..."
            />
            
            <Autocomplete
              multiple
              freeSolo
              options={['AI', 'Collaboration', 'Productivity', 'Innovation', 'Strategy']}
              value={newPost.tags}
              onChange={(_, value) => setNewPost(prev => ({ ...prev, tags: value }))}
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Add tags..." />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
            
            <FormControl fullWidth>
              <InputLabel>Visibility</InputLabel>
              <Select
                value={newPost.visibility}
                onChange={(e) => setNewPost(prev => ({ ...prev, visibility: e.target.value }))}
                label="Visibility"
              >
                <MenuItem value="public">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Public fontSize="small" />
                    Public
                  </Box>
                </MenuItem>
                <MenuItem value="connections">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People fontSize="small" />
                    Connections Only
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePost(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={!newPost.title.trim() || !newPost.content.trim()}
          >
            Share Post
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SocialFeed;

