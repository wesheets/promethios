import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
  Avatar,
  Divider,
  Badge,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  People,
  Add,
  Explore,
  Public,
  Business,
  Science,
  Palette,
  Code,
  Analytics,
  School,
  Refresh,
  FilterList,
} from '@mui/icons-material';

// Import components
import SocialFeed from '../components/social/SocialFeed';
import { socialFeedService } from '../services/SocialFeedService';
import { useChatIntegration } from '../components/social/ChatIntegrationProvider';

interface AICollaborationServer {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  onlineCount: number;
  icon: string;
  isPublic: boolean;
  tags: string[];
  featured: boolean;
}

interface SocialFeedPageProps {
  onViewProfile?: (userId: string) => void;
  onStartCollaboration?: (userId: string) => void;
  onViewConversation?: (conversationId: string) => void;
  onJoinServer?: (serverId: string) => void;
}

const SocialFeedPage: React.FC<SocialFeedPageProps> = ({
  onViewProfile,
  onStartCollaboration,
  onViewConversation,
  onJoinServer,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<{ tag: string; count: number }[]>([]);
  const [featuredServers, setFeaturedServers] = useState<AICollaborationServer[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  
  // Chat integration
  const { openDirectMessage } = useChatIntegration();

  // Mock AI Collaboration Servers (Discord-inspired)
  const mockServers: AICollaborationServer[] = [
    {
      id: '1',
      name: 'Marketing AI Masters',
      description: 'AI-powered marketing strategies, campaign optimization, and creative collaboration',
      category: 'Business Strategy',
      memberCount: 2847,
      onlineCount: 234,
      icon: '🎯',
      isPublic: true,
      tags: ['Marketing', 'Claude', 'Strategy', 'Creative'],
      featured: true,
    },
    {
      id: '2',
      name: 'Engineering with AI',
      description: 'Code reviews, architecture discussions, and AI-assisted development',
      category: 'Technical Development',
      memberCount: 5621,
      onlineCount: 456,
      icon: '💻',
      isPublic: true,
      tags: ['Engineering', 'OpenAI', 'Code', 'Architecture'],
      featured: true,
    },
    {
      id: '3',
      name: 'Creative AI Collective',
      description: 'Artists, designers, and writers exploring AI collaboration',
      category: 'Creative AI',
      memberCount: 1923,
      onlineCount: 178,
      icon: '🎨',
      isPublic: true,
      tags: ['Creative', 'Design', 'Writing', 'Art'],
      featured: true,
    },
    {
      id: '4',
      name: 'Data Science AI Hub',
      description: 'Research, analysis, and AI-powered insights',
      category: 'Research & Analysis',
      memberCount: 3456,
      onlineCount: 289,
      icon: '📊',
      isPublic: true,
      tags: ['DataScience', 'Research', 'Analytics', 'Gemini'],
      featured: false,
    },
    {
      id: '5',
      name: 'Product AI Strategy',
      description: 'Product managers leveraging AI for better decisions',
      category: 'Business Strategy',
      memberCount: 1567,
      onlineCount: 123,
      icon: '🚀',
      isPublic: true,
      tags: ['Product', 'Strategy', 'Management', 'AI'],
      featured: false,
    },
    {
      id: '6',
      name: 'AI Research Network',
      description: 'Academic researchers and AI scientists collaborating',
      category: 'Research & Analysis',
      memberCount: 892,
      onlineCount: 67,
      icon: '🔬',
      isPublic: true,
      tags: ['Research', 'Academic', 'Science', 'Innovation'],
      featured: false,
    },
  ];

  const serverCategories = [
    { id: 'creative', name: 'Creative AI', icon: <Palette />, color: '#FF6B35' },
    { id: 'business', name: 'Business Strategy', icon: <Business />, color: '#4CAF50' },
    { id: 'technical', name: 'Technical Development', icon: <Code />, color: '#2196F3' },
    { id: 'research', name: 'Research & Analysis', icon: <Science />, color: '#9C27B0' },
    { id: 'analytics', name: 'Data & Analytics', icon: <Analytics />, color: '#FF9800' },
    { id: 'education', name: 'Learning & Education', icon: <School />, color: '#795548' },
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const trending = await socialFeedService.getTrendingTopics();
      setTrendingTopics(trending);
      setFeaturedServers(mockServers.filter(s => s.featured));
      
      // Mock active users
      setActiveUsers([
        { id: '1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', status: 'Collaborating with Claude' },
        { id: '2', name: 'Marcus Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'Research session' },
        { id: '3', name: 'Emily Watson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', status: 'Creative brainstorming' },
      ]);
    } catch (err) {
      setError('Failed to load social feed data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinServer = (serverId: string) => {
    console.log('Joining server:', serverId);
    onJoinServer?.(serverId);
  };

  const handleStartChat = (userId: string, userName: string, userAvatar?: string) => {
    openDirectMessage(userId, userName, userAvatar);
  };

  const handleExploreServers = () => {
    console.log('Explore all servers');
    // This would navigate to a full server discovery page
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          AI Collaboration Network
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover communities, share insights, and connect with AI professionals
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Main Feed */}
        <Grid item xs={12} md={8}>
          <SocialFeed
            variant="home"
            onViewProfile={onViewProfile}
            onStartCollaboration={onStartCollaboration}
            onViewConversation={onViewConversation}
          />
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Active Now - Discord Style */}
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={activeUsers.length} color="success">
                <People />
              </Badge>
              Active Now
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {activeUsers.map((user) => (
                <Box 
                  key={user.id} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => handleStartChat(user.id, user.name, user.avatar)}
                >
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: '#4CAF50',
                          border: '2px solid white',
                        }}
                      />
                    }
                  >
                    <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
                      {user.name.charAt(0)}
                    </Avatar>
                  </Badge>
                  
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {user.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {user.status}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Featured AI Collaboration Servers - Discord Style */}
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Explore />
                Featured Communities
              </Typography>
              
              <Tooltip title="Explore All Servers">
                <IconButton size="small" onClick={handleExploreServers}>
                  <Add />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {featuredServers.map((server) => (
                <Card key={server.id} variant="outlined" sx={{ cursor: 'pointer' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          backgroundColor: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        {server.icon}
                      </Box>
                      
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {server.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          {server.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {server.memberCount.toLocaleString()} members
                            </Typography>
                            <Typography variant="caption" color="success.main">
                              {server.onlineCount} online
                            </Typography>
                          </Box>
                          
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleJoinServer(server.id)}
                          >
                            Join
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Explore />}
              onClick={handleExploreServers}
              sx={{ mt: 2 }}
            >
              Explore All AI Communities
            </Button>
          </Paper>

          {/* Server Categories */}
          <Paper sx={{ 
            p: 3, 
            mb: 3,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Browse by Category
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {serverCategories.map((category) => (
                <Button
                  key={category.id}
                  variant="text"
                  startIcon={category.icon}
                  onClick={() => console.log('Browse category:', category.id)}
                  sx={{
                    justifyContent: 'flex-start',
                    color: category.color,
                    '&:hover': {
                      backgroundColor: `${category.color}15`,
                    },
                  }}
                >
                  {category.name}
                </Button>
              ))}
            </Box>
          </Paper>

          {/* Trending Topics */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              Trending in AI
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {trendingTopics.map((topic) => (
                <Chip
                  key={topic.tag}
                  label={`#${topic.tag}`}
                  size="small"
                  variant="outlined"
                  onClick={() => console.log('Search topic:', topic.tag)}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SocialFeedPage;

