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
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Search,
  TrendingUp,
  People,
  Star,
  AutoAwesome,
  Business,
  LocationOn,
  Message,
  PersonAdd,
  Handshake,
  Circle,
  SmartToy,
} from '@mui/icons-material';

// Import Firebase services
import { firebaseUserDiscoveryService, FirebaseUser, DiscoveryFilters } from '../services/FirebaseUserDiscoveryService';
import { useConnections } from '../hooks/useConnections';

// Import components
import UserSearchEngine from '../components/social/UserSearchEngine';
import UserProfileCard from '../components/social/UserProfileCard';

interface DiscoveryPageProps {
  onViewProfile?: (userId: string) => void;
  onConnect?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onStartCollaboration?: (userId: string) => void;
}

const DiscoveryPage: React.FC<DiscoveryPageProps> = ({
  onViewProfile,
  onConnect,
  onMessage,
  onStartCollaboration,
}) => {
  const [searchResults, setSearchResults] = useState<FirebaseUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredUsers, setFeaturedUsers] = useState<FirebaseUser[]>([]);
  const [allUsers, setAllUsers] = useState<FirebaseUser[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Connection management
  const {
    connections,
    sendConnectionRequest,
    sendingRequest,
    isConnectedTo,
    hasSentRequestTo,
    hasPendingRequestFrom,
    getConnectionStatus
  } = useConnections();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log('🔍 [Discovery] Loading Firebase users...');
      
      // Load all users from Firebase
      const users = await firebaseUserDiscoveryService.getAllUsers();
      setAllUsers(users);
      
      // Load featured users (highly rated, online users)
      const featured = await firebaseUserDiscoveryService.getFeaturedUsers(6);
      setFeaturedUsers(featured);
      
      // Extract trending skills from all users
      const skillsMap = new Map<string, number>();
      users.forEach(user => {
        user.profile?.skills?.forEach(skill => {
          skillsMap.set(skill, (skillsMap.get(skill) || 0) + 1);
        });
      });
      
      const topSkills = Array.from(skillsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([skill]) => skill);
      
      setTrendingSkills(topSkills);
      
      // Load recent searches from localStorage
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
      
      console.log(`🔍 [Discovery] Loaded ${users.length} users, ${featured.length} featured`);
    } catch (err) {
      setError('Failed to load users from Firebase');
      console.error('Error loading Firebase users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, filters?: DiscoveryFilters) => {
    setLoading(true);
    setError(null);
    setSearchQuery(query);
    
    try {
      const results = await firebaseUserDiscoveryService.searchUsers(query, filters);
      setSearchResults(results);
      
      // Save search query to recent searches
      if (query.trim()) {
        const newSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
        setRecentSearches(newSearches);
        localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleQuickSearch = (query: string) => {
    handleSearch(query);
  };

  const handleConnect = async (userId: string) => {
    try {
      console.log('🤝 [Discovery] Sending connection request to:', userId);
      
      const success = await sendConnectionRequest(
        userId, 
        "Hi! I'd like to connect and explore AI collaboration opportunities together."
      );
      
      if (success) {
        // Show success feedback
        console.log('🤝 [Discovery] Connection request sent successfully');
        onConnect?.(userId);
      }
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      console.log('💬 [Discovery] Starting message with:', userId);
      onMessage?.(userId);
    } catch (err) {
      console.error('Error starting message:', err);
    }
  };

  const handleCollaborate = async (userId: string) => {
    try {
      console.log('🤖 [Discovery] Starting collaboration with:', userId);
      onStartCollaboration?.(userId);
    } catch (err) {
      console.error('Error starting collaboration:', err);
    }
  };

  // Get connection button state
  const getConnectionButtonState = (userId: string) => {
    if (isConnectedTo(userId)) {
      return { text: 'Connected', disabled: true, variant: 'contained' as const };
    }
    if (hasSentRequestTo(userId)) {
      return { text: 'Request Sent', disabled: true, variant: 'outlined' as const };
    }
    if (hasPendingRequestFrom(userId)) {
      return { text: 'Accept Request', disabled: false, variant: 'contained' as const };
    }
    return { text: 'Connect', disabled: sendingRequest, variant: 'outlined' as const };
  };

  const UserCard: React.FC<{ user: FirebaseUser; variant?: 'full' | 'compact' }> = ({ 
    user, 
    variant = 'full' 
  }) => {
    return (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        boxShadow: 3,
        borderColor: 'primary.main'
      }
    }}>
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* User Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              user.preferences?.showOnlineStatus && user.isOnline ? (
                <Circle sx={{ color: '#10b981', fontSize: 12 }} />
              ) : null
            }
          >
            <Avatar
              src={user.photoURL}
              sx={{ width: 56, height: 56, mr: 2 }}
            >
              {user.displayName?.charAt(0)}
            </Avatar>
          </Badge>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.profile?.title}
            </Typography>
            {user.profile?.company && (
              <Typography variant="caption" color="text.secondary">
                {user.profile.company}
              </Typography>
            )}
          </Box>
        </Box>

        {/* User Info */}
        {variant === 'full' && (
          <>
            {user.profile?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {user.profile.location}
                </Typography>
              </Box>
            )}

            {user.profile?.bio && (
              <Typography variant="body2" color="text.secondary" sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {user.profile.bio}
              </Typography>
            )}

            {/* Skills */}
            {user.profile?.skills && user.profile.skills.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {user.profile.skills.slice(0, 3).map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  ))}
                  {user.profile.skills.length > 3 && (
                    <Chip
                      label={`+${user.profile.skills.length - 3}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Stats */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {user.stats?.connections || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Connections
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {user.stats?.rating?.toFixed(1) || '4.0'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {user.stats?.responseTime || 0}m
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Response
                </Typography>
              </Box>
            </Box>
          </>
        )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {(() => {
                const buttonState = getConnectionButtonState(user.uid);
                return (
                  <Button
                    variant={buttonState.variant}
                    size="small"
                    startIcon={<PersonAdd />}
                    onClick={() => handleConnect(user.uid)}
                    disabled={buttonState.disabled}
                    sx={{ 
                      minWidth: 120,
                      color: buttonState.variant === 'contained' ? 'white' : 'primary.main'
                    }}
                  >
                    {buttonState.text}
                  </Button>
                );
              })()}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<Message />}
                onClick={() => handleMessage(user.uid)}
                disabled={!isConnectedTo(user.uid)}
                sx={{ minWidth: 100 }}
              >
                Message
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<SmartToy />}
                onClick={() => handleCollaborate(user.uid)}
                disabled={!isConnectedTo(user.uid)}
                sx={{ minWidth: 120 }}
              >
                Collaborate
              </Button>
            </Box>
          </CardContent>
        </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
          Discover AI Collaboration Partners
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find professionals with complementary AI skills and collaboration styles
        </Typography>
      </Box>

      {/* Search Engine */}
      <UserSearchEngine
        onSearch={handleSearch}
        onClearFilters={handleClearSearch}
        isLoading={loading}
        resultCount={searchResults.length}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search />
            Search Results ({searchResults.length})
          </Typography>
          
          <Grid container spacing={2}>
            {searchResults.map((user) => (
              <Grid item xs={12} md={6} lg={4} key={user.id}>
                <UserProfileCard
                  user={user}
                  variant="compact"
                  onViewProfile={() => onViewProfile?.(user.id)}
                  onConnect={() => handleConnect(user.id)}
                  onMessage={() => onMessage?.(user.id)}
                  onStartCollaboration={() => onStartCollaboration?.(user.id)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Quick Search Suggestions */}
      {searchResults.length === 0 && (
        <Grid container spacing={3}>
          {/* Featured Collaborators */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ 
              p: 3, 
              mb: 3, 
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                <Star sx={{ color: '#FFD700' }} />
                Featured AI Collaborators
              </Typography>
              
              <Grid container spacing={2}>
                {featuredUsers.map((user) => (
                  <Grid item xs={12} md={6} key={user.id}>
                    <UserProfileCard
                      user={user}
                      variant="minimal"
                      onViewProfile={() => onViewProfile?.(user.id)}
                      onConnect={() => handleConnect(user.id)}
                      onMessage={() => onMessage?.(user.id)}
                      onStartCollaboration={() => onStartCollaboration?.(user.id)}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {featuredUsers.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AutoAwesome sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Discovering Featured Collaborators
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We're finding the best AI collaboration partners for you
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Trending Skills */}
            <Paper sx={{ 
              p: 3, 
              mb: 3,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary' }}>
                <TrendingUp />
                Trending AI Skills
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {trendingSkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    variant="outlined"
                    onClick={() => handleQuickSearch(skill)}
                    sx={{ cursor: 'pointer', justifyContent: 'flex-start' }}
                  />
                ))}
              </Box>
            </Paper>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Paper sx={{ 
                p: 3, 
                mb: 3,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                  Recent Searches
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recentSearches.map((search) => (
                    <Button
                      key={search}
                      variant="text"
                      onClick={() => handleQuickSearch(search)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {search}
                    </Button>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Quick Actions */}
            <Paper sx={{ 
              p: 3,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Quick Discovery
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => handleQuickSearch('Claude')}
                  fullWidth
                >
                  Find Claude Experts
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={() => handleQuickSearch('Creative')}
                  fullWidth
                >
                  Creative Professionals
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Business />}
                  onClick={() => handleQuickSearch('Product Manager')}
                  fullWidth
                >
                  Product Leaders
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<LocationOn />}
                  onClick={() => handleQuickSearch('San Francisco')}
                  fullWidth
                >
                  Local Collaborators
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Empty State for No Results */}
      {searchResults.length === 0 && featuredUsers.length === 0 && !loading && (
        <Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider'
        }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
            Start Your AI Collaboration Journey
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Use the search filters above to find professionals with the AI skills you need
          </Typography>
          <Button variant="contained" onClick={() => handleQuickSearch('AI')}>
            Explore AI Professionals
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default DiscoveryPage;
