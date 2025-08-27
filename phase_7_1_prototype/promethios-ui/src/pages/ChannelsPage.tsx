import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  Avatar,
  Chip,
  Badge,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  AvatarGroup,
} from '@mui/material';
import {
  Tag,
  Add,
  Lock,
  Public,
  People,
  AutoAwesome,
  Notifications,
  Settings,
  Star,
  TrendingUp,
  Message,
  VolumeOff,
  PushPin,
  Schedule,
} from '@mui/icons-material';

interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private' | 'direct';
  memberCount: number;
  onlineCount: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isStarred: boolean;
  lastActivity: string;
  aiAgentsEnabled: string[];
  recentMessages: ChannelMessage[];
  members: ChannelMember[];
  organizationId?: string;
  organizationName?: string;
}

interface ChannelMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
  aiAgent?: string;
}

interface ChannelMember {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  role: 'admin' | 'member' | 'guest';
}

interface ChannelsPageProps {
  onJoinChannel?: (channelId: string) => void;
  onCreateChannel?: () => void;
  onOpenChannel?: (channelId: string) => void;
  currentUserId?: string;
}

const ChannelsPage: React.FC<ChannelsPageProps> = ({
  onJoinChannel,
  onCreateChannel,
  onOpenChannel,
  currentUserId = 'current-user',
}) => {
  const [myChannels, setMyChannels] = useState<Channel[]>([]);
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'ai-enabled'>('all');

  // Mock data
  const mockMyChannels: Channel[] = [
    {
      id: '1',
      name: 'general',
      description: 'Company-wide announcements and general discussion',
      type: 'public',
      memberCount: 47,
      onlineCount: 12,
      unreadCount: 3,
      isPinned: true,
      isMuted: false,
      isStarred: false,
      lastActivity: '2 minutes ago',
      aiAgentsEnabled: ['Claude', 'OpenAI'],
      organizationId: '1',
      organizationName: 'Promethios',
      recentMessages: [
        { id: '1', author: 'Sarah Chen', content: 'Great AI collaboration session today!', timestamp: '2 min ago' },
        { id: '2', author: 'Claude Assistant', content: 'I can help analyze the quarterly results if needed.', timestamp: '5 min ago', isAI: true, aiAgent: 'Claude' },
      ],
      members: [
        { id: '1', name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', isOnline: true, role: 'admin' },
        { id: '2', name: 'Marcus Rodriguez', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isOnline: true, role: 'member' },
        { id: '3', name: 'Emily Watson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', isOnline: false, role: 'member' },
      ],
    },
    {
      id: '2',
      name: 'engineering',
      description: 'Engineering team collaboration and AI-assisted development',
      type: 'public',
      memberCount: 15,
      onlineCount: 5,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isStarred: true,
      lastActivity: '15 minutes ago',
      aiAgentsEnabled: ['OpenAI', 'Claude'],
      organizationId: '1',
      organizationName: 'Promethios',
      recentMessages: [
        { id: '1', author: 'David Kim', content: 'Code review completed with GPT-4 assistance', timestamp: '15 min ago' },
        { id: '2', author: 'OpenAI Assistant', content: 'The code optimization suggestions have been implemented.', timestamp: '20 min ago', isAI: true, aiAgent: 'OpenAI' },
      ],
      members: [
        { id: '4', name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', isOnline: true, role: 'admin' },
        { id: '5', name: 'Alex Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', isOnline: true, role: 'member' },
      ],
    },
    {
      id: '3',
      name: 'marketing',
      description: 'Marketing campaigns and AI-powered content strategy',
      type: 'public',
      memberCount: 12,
      onlineCount: 2,
      unreadCount: 7,
      isPinned: false,
      isMuted: false,
      isStarred: false,
      lastActivity: '1 hour ago',
      aiAgentsEnabled: ['Claude'],
      organizationId: '1',
      organizationName: 'Promethios',
      recentMessages: [
        { id: '1', author: 'Lisa Park', content: 'New campaign strategy ready for review', timestamp: '1 hour ago' },
        { id: '2', author: 'Claude Assistant', content: 'I\'ve analyzed the target audience data and have recommendations.', timestamp: '1 hour ago', isAI: true, aiAgent: 'Claude' },
      ],
      members: [
        { id: '6', name: 'Lisa Park', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', isOnline: true, role: 'admin' },
        { id: '7', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', isOnline: false, role: 'member' },
      ],
    },
    {
      id: '4',
      name: 'executive-strategy',
      description: 'Leadership team strategic planning with AI insights',
      type: 'private',
      memberCount: 5,
      onlineCount: 1,
      unreadCount: 0,
      isPinned: true,
      isMuted: false,
      isStarred: true,
      lastActivity: '3 hours ago',
      aiAgentsEnabled: ['Claude'],
      organizationId: '1',
      organizationName: 'Promethios',
      recentMessages: [
        { id: '1', author: 'CEO', content: 'Q4 planning session scheduled', timestamp: '3 hours ago' },
      ],
      members: [
        { id: '8', name: 'CEO', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', isOnline: true, role: 'admin' },
      ],
    },
  ];

  const mockPublicChannels: Channel[] = [
    {
      id: '5',
      name: 'ai-marketing-masters',
      description: 'Cross-company marketing professionals sharing AI strategies',
      type: 'public',
      memberCount: 1247,
      onlineCount: 89,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isStarred: false,
      lastActivity: 'Active now',
      aiAgentsEnabled: ['Claude', 'OpenAI'],
      recentMessages: [
        { id: '1', author: 'Marketing Expert', content: 'Just achieved 40% conversion improvement with AI-assisted campaigns!', timestamp: '1 min ago' },
      ],
      members: [],
    },
    {
      id: '6',
      name: 'engineering-ai-collective',
      description: 'Developers sharing AI-assisted coding techniques and best practices',
      type: 'public',
      memberCount: 2156,
      onlineCount: 234,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isStarred: false,
      lastActivity: 'Active now',
      aiAgentsEnabled: ['OpenAI', 'Claude', 'Gemini'],
      recentMessages: [
        { id: '1', author: 'Senior Dev', content: 'New AI code review workflow reduced bugs by 60%', timestamp: '3 min ago' },
      ],
      members: [],
    },
    {
      id: '7',
      name: 'creative-ai-studio',
      description: 'Artists, designers, and writers exploring AI collaboration',
      type: 'public',
      memberCount: 892,
      onlineCount: 67,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
      isStarred: false,
      lastActivity: '5 minutes ago',
      aiAgentsEnabled: ['Claude', 'Gemini'],
      recentMessages: [
        { id: '1', author: 'Creative Director', content: 'AI-human collaboration just won us a major client!', timestamp: '5 min ago' },
      ],
      members: [],
    },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setMyChannels(mockMyChannels);
      setPublicChannels(mockPublicChannels);
    } catch (err) {
      setError('Failed to load channels');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = (channelId: string) => {
    console.log('Joining channel:', channelId);
    onJoinChannel?.(channelId);
  };

  const handleToggleStar = (channelId: string) => {
    setMyChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, isStarred: !channel.isStarred }
        : channel
    ));
  };

  const handleToggleMute = (channelId: string) => {
    setMyChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, isMuted: !channel.isMuted }
        : channel
    ));
  };

  const getFilteredChannels = (channels: Channel[]) => {
    switch (filter) {
      case 'unread':
        return channels.filter(c => c.unreadCount > 0);
      case 'starred':
        return channels.filter(c => c.isStarred);
      case 'ai-enabled':
        return channels.filter(c => c.aiAgentsEnabled.length > 0);
      default:
        return channels;
    }
  };

  const renderChannelCard = (channel: Channel, isPublic: boolean = false) => (
    <Card key={channel.id} sx={{ 
      cursor: 'pointer',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      '&:hover': {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(49, 130, 206, 0.3)',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 4px 20px rgba(0,0,0,0.1)',
      }
    }} onClick={() => onOpenChannel?.(channel.id)}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {channel.type === 'private' ? <Lock /> : <Tag />}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              #{channel.name}
            </Typography>
          </Box>
          
          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
            {channel.isPinned && <PushPin sx={{ fontSize: 16, color: 'text.secondary' }} />}
            {channel.isStarred && <Star sx={{ fontSize: 16, color: '#FFD700' }} />}
            {channel.isMuted && <VolumeOff sx={{ fontSize: 16, color: 'text.secondary' }} />}
            {channel.unreadCount > 0 && (
              <Badge badgeContent={channel.unreadCount} color="primary" />
            )}
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {channel.description}
        </Typography>

        {/* Organization */}
        {channel.organizationName && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {channel.organizationName}
          </Typography>
        )}

        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <People sx={{ fontSize: 16 }} />
            <Typography variant="body2">
              {channel.memberCount} members
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Badge badgeContent="" color="success" variant="dot" />
            <Typography variant="body2" color="success.main">
              {channel.onlineCount} online
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary">
            {channel.lastActivity}
          </Typography>
        </Box>

        {/* AI Agents */}
        {channel.aiAgentsEnabled.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AutoAwesome sx={{ fontSize: 16 }} />
              <Typography variant="caption" color="text.secondary">
                AI Agents:
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {channel.aiAgentsEnabled.map((agent) => (
                <Chip key={agent} label={agent} size="small" />
              ))}
            </Box>
          </Box>
        )}

        {/* Recent Messages Preview */}
        {channel.recentMessages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Recent Activity:
            </Typography>
            {channel.recentMessages.slice(0, 2).map((message) => (
              <Box key={message.id} sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {message.isAI && <AutoAwesome sx={{ fontSize: 12 }} />}
                  <strong>{message.author}:</strong>
                  <span>{message.content}</span>
                  <span style={{ color: 'text.secondary' }}>({message.timestamp})</span>
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Members Preview */}
        {channel.members.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
              {channel.members.map((member) => (
                <Avatar
                  key={member.id}
                  src={member.avatar}
                  sx={{ width: 24, height: 24 }}
                >
                  {member.name.charAt(0)}
                </Avatar>
              ))}
            </AvatarGroup>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          {isPublic ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={(e) => {
                e.stopPropagation();
                handleJoinChannel(channel.id);
              }}
              fullWidth
            >
              Join Channel
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<Message />}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChannel?.(channel.id);
                }}
                fullWidth
              >
                Open
              </Button>
              
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStar(channel.id);
                }}
              >
                <Star sx={{ color: channel.isStarred ? '#FFD700' : 'text.secondary' }} />
              </IconButton>
              
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleMute(channel.id);
                }}
              >
                {channel.isMuted ? <VolumeOff /> : <Notifications />}
              </IconButton>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const filteredMyChannels = getFilteredChannels(myChannels);
  const totalUnread = myChannels.reduce((sum, channel) => sum + channel.unreadCount, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Channels
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Collaborate with your team and AI agents in organized channels
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={filter === 'all' ? 'contained' : 'outlined'}
            onClick={() => setFilter('all')}
          >
            All Channels
          </Button>
          <Button
            variant={filter === 'unread' ? 'contained' : 'outlined'}
            onClick={() => setFilter('unread')}
            startIcon={totalUnread > 0 ? <Badge badgeContent={totalUnread} color="primary" /> : undefined}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'starred' ? 'contained' : 'outlined'}
            onClick={() => setFilter('starred')}
            startIcon={<Star />}
          >
            Starred
          </Button>
          <Button
            variant={filter === 'ai-enabled' ? 'contained' : 'outlined'}
            onClick={() => setFilter('ai-enabled')}
            startIcon={<AutoAwesome />}
          >
            AI Enabled
          </Button>
        </Box>
      </Paper>

      {/* My Channels */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tag />
            My Channels ({filteredMyChannels.length})
            {totalUnread > 0 && (
              <Badge badgeContent={totalUnread} color="primary" />
            )}
          </Typography>
          
          <Button variant="contained" startIcon={<Add />} onClick={onCreateChannel}>
            Create Channel
          </Button>
        </Box>
        
        {filteredMyChannels.length > 0 ? (
          <Grid container spacing={3}>
            {filteredMyChannels.map((channel) => (
              <Grid item xs={12} md={6} lg={4} key={channel.id}>
                {renderChannelCard(channel, false)}
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Tag sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              {filter === 'all' ? 'No Channels Yet' : `No ${filter} Channels`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {filter === 'all' 
                ? 'Create or join channels to start collaborating with your team and AI agents'
                : `No channels match the ${filter} filter`
              }
            </Typography>
            {filter === 'all' && (
              <Button variant="contained" startIcon={<Add />} onClick={onCreateChannel}>
                Create Your First Channel
              </Button>
            )}
          </Paper>
        )}
      </Box>

      {/* Public Channels */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Public />
          Discover Public Channels ({publicChannels.length})
        </Typography>
        
        <Grid container spacing={3}>
          {publicChannels.map((channel) => (
            <Grid item xs={12} md={6} lg={4} key={channel.id}>
              {renderChannelCard(channel, true)}
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default ChannelsPage;

