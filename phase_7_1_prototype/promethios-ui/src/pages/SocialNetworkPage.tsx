import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Badge,
  Chip,
  Avatar,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import {
  People,
  Search,
  Notifications,
  Message,
  AutoAwesome,
  TrendingUp,
  Business,
  Public,
  Settings,
  Add,
} from '@mui/icons-material';

// Import our social components
import SocialFeed from '../components/social/SocialFeed';
import UserSearchEngine from '../components/social/UserSearchEngine';
import UserProfileCard from '../components/social/UserProfileCard';
import PrivacyModeSelector from '../components/social/PrivacyModeSelector';

// Import services
import { userProfileService, UserProfile } from '../services/UserProfileService';
import { socialFeedService } from '../services/SocialFeedService';

interface SocialNetworkPageProps {
  onStartCollaboration?: (userId: string) => void;
  onSendMessage?: (userId: string) => void;
  onViewConversation?: (conversationId: string) => void;
  currentUserId?: string;
}

const SocialNetworkPage: React.FC<SocialNetworkPageProps> = ({
  onStartCollaboration,
  onSendMessage,
  onViewConversation,
  currentUserId = 'current-user',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ incoming: any[]; outgoing: any[] }>({
    incoming: [],
    outgoing: [],
  });
  const [trendingTopics, setTrendingTopics] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    currentMode: 'professional',
    allowPublicProfile: true,
    allowExternalMessages: true,
    allowCrossCompanyCollaboration: true,
    shareAIAgentPortfolio: true,
    shareCollaborationHistory: true,
    autoSwitchModes: false,
    workHoursOnly: false,
  });

  const [companySettings] = useState({
    id: 'promethios',
    name: 'Promethios',
    domain: 'promethios.com',
    allowExternalCollaboration: true,
    requireApprovalForExternal: false,
    dataResidency: 'us' as const,
    ssoEnabled: true,
    adminApprovalRequired: false,
  });

  const tabs = [
    { label: 'Feed', icon: <AutoAwesome />, value: 'feed' },
    { label: 'Discover', icon: <Search />, value: 'discover' },
    { label: 'Network', icon: <People />, value: 'network' },
    { label: 'Trending', icon: <TrendingUp />, value: 'trending' },
  ];

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [user, connectionsData, requests, trending] = await Promise.all([
        userProfileService.getCurrentUserProfile(),
        userProfileService.getUserConnections(),
        userProfileService.getPendingConnectionRequests(),
        socialFeedService.getTrendingTopics(),
      ]);

      setCurrentUser(user);
      setConnections(connectionsData);
      setPendingRequests(requests);
      setTrendingTopics(trending);
    } catch (err) {
      setError('Failed to load social network data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSearch = async (filters: any) => {
    try {
      const result = await userProfileService.searchUsers(filters);
      setSearchResults(result.users);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
  };

  const handleViewProfile = (userId: string) => {
    // This would navigate to a detailed profile page
    console.log('View profile:', userId);
  };

  const handleConnect = async (userId: string) => {
    try {
      await userProfileService.sendConnectionRequest(userId, 'Would love to connect and explore AI collaboration opportunities!');
      // Refresh pending requests
      const requests = await userProfileService.getPendingConnectionRequests();
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      await userProfileService.acceptConnectionRequest(connectionId);
      // Refresh data
      const [connectionsData, requests] = await Promise.all([
        userProfileService.getUserConnections(),
        userProfileService.getPendingConnectionRequests(),
      ]);
      setConnections(connectionsData);
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error accepting connection:', err);
    }
  };

  const handlePrivacyModeChange = (mode: string) => {
    setPrivacySettings(prev => ({ ...prev, currentMode: mode }));
  };

  const handlePrivacySettingsChange = (settings: any) => {
    setPrivacySettings(prev => ({ ...prev, ...settings }));
  };

  const renderFeedTab = () => (
    <Box>
      <SocialFeed
        userId={currentUserId}
        variant="home"
        onViewProfile={handleViewProfile}
        onStartCollaboration={onStartCollaboration}
        onViewConversation={onViewConversation}
      />
    </Box>
  );

  const renderDiscoverTab = () => (
    <Box>
      <UserSearchEngine
        onSearch={handleSearch}
        onClearFilters={handleClearSearch}
        resultCount={searchResults.length}
      />
      
      {searchResults.length > 0 && (
        <Grid container spacing={2}>
          {searchResults.map((user) => (
            <Grid item xs={12} md={6} lg={4} key={user.id}>
              <UserProfileCard
                user={user}
                variant="compact"
                onViewProfile={() => handleViewProfile(user.id)}
                onConnect={() => handleConnect(user.id)}
                onMessage={() => onSendMessage?.(user.id)}
                onStartCollaboration={() => onStartCollaboration?.(user.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {searchResults.length === 0 && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Discover AI Collaboration Partners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the search filters above to find professionals with complementary AI skills
          </Typography>
        </Paper>
      )}
    </Box>
  );

  const renderNetworkTab = () => (
    <Box>
      {/* Pending Connection Requests */}
      {pendingRequests.incoming.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={pendingRequests.incoming.length} color="primary">
              <Notifications />
            </Badge>
            Connection Requests
          </Typography>
          
          <Grid container spacing={2}>
            {pendingRequests.incoming.map((request) => (
              <Grid item xs={12} md={6} key={request.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 48, height: 48 }}>
                        {request.fromUser?.name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {request.fromUser?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {request.fromUser?.title} at {request.fromUser?.company}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {request.message && (
                      <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                        "{request.message}"
                      </Typography>
                    )}
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAcceptConnection(request.id)}
                      >
                        Accept
                      </Button>
                      <Button variant="outlined" size="small">
                        Decline
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
      
      {/* My Connections */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <People />
          My Network ({connections.length} connections)
        </Typography>
        
        <Grid container spacing={2}>
          {connections.map((user) => (
            <Grid item xs={12} md={6} lg={4} key={user.id}>
              <UserProfileCard
                user={user}
                variant="minimal"
                onViewProfile={() => handleViewProfile(user.id)}
                onMessage={() => onSendMessage?.(user.id)}
                onStartCollaboration={() => onStartCollaboration?.(user.id)}
              />
            </Grid>
          ))}
        </Grid>
        
        {connections.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Build Your AI Collaboration Network
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Connect with professionals to unlock powerful AI collaboration opportunities
            </Typography>
            <Button variant="contained" startIcon={<Search />} onClick={() => setActiveTab(1)}>
              Discover People
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );

  const renderTrendingTab = () => (
    <Box>
      <Grid container spacing={3}>
        {/* Trending Topics */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp />
              Trending Topics
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {trendingTopics.map((topic, index) => (
                <Box key={topic.tag} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={`#${topic.tag}`}
                    size="small"
                    variant="outlined"
                    sx={{ cursor: 'pointer' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {topic.count} posts
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        {/* Trending Feed */}
        <Grid item xs={12} md={8}>
          <SocialFeed
            userId={currentUserId}
            variant="trending"
            onViewProfile={handleViewProfile}
            onStartCollaboration={onStartCollaboration}
            onViewConversation={onViewConversation}
          />
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography>Loading social network...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Privacy Mode Selector */}
      <PrivacyModeSelector
        currentMode={privacySettings.currentMode}
        userSettings={privacySettings}
        companySettings={companySettings}
        onModeChange={handlePrivacyModeChange}
        onSettingsChange={handlePrivacySettingsChange}
        isAdmin={false}
      />
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Main Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              AI Collaboration Network
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Message />}
                onClick={() => onSendMessage?.('new')}
              >
                New Message
              </Button>
              
              <Button
                variant="contained"
                startIcon={<AutoAwesome />}
                onClick={() => onStartCollaboration?.('new')}
              >
                Start Collaboration
              </Button>
            </Box>
          </Box>
          
          {/* User Info Bar */}
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar src={currentUser.avatar} sx={{ width: 40, height: 40 }}>
                {currentUser.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {currentUser.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentUser.title} at {currentUser.company}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {currentUser.connectionCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Connections
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {currentUser.collaborationRating.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Rating
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {currentUser.totalCollaborations}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Collaborations
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
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
      
      {/* Tab Content */}
      <Box>
        {activeTab === 0 && renderFeedTab()}
        {activeTab === 1 && renderDiscoverTab()}
        {activeTab === 2 && renderNetworkTab()}
        {activeTab === 3 && renderTrendingTab()}
      </Box>
    </Container>
  );
};

export default SocialNetworkPage;

