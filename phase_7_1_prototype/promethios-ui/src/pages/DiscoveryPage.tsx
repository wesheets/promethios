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
} from '@mui/material';
import {
  Search,
  TrendingUp,
  People,
  Star,
  AutoAwesome,
  Business,
  LocationOn,
} from '@mui/icons-material';

// Import components
import UserSearchEngine from '../components/social/UserSearchEngine';
import UserProfileCard from '../components/social/UserProfileCard';

// Import services
import { userProfileService, UserProfile, SearchFilters } from '../services/UserProfileService';

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
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuredUsers, setFeaturedUsers] = useState<UserProfile[]>([]);
  const [trendingSkills, setTrendingSkills] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load featured users (highly rated collaborators)
      const result = await userProfileService.searchUsers({
        query: '',
        location: [],
        company: [],
        industry: [],
        skills: [],
        aiAgents: [],
        aiSkills: [],
        collaborationStyle: [],
        experienceLevel: '',
        collaborationRating: [4.5, 5],
        connectionLevel: '',
        isOnline: null,
        hasPublicProfile: true,
      }, 1, 6);
      
      setFeaturedUsers(result.users);
      
      // Mock trending skills
      setTrendingSkills(['AI Strategy', 'Claude', 'Product Management', 'Data Science', 'Creative Writing']);
      
      // Load recent searches from localStorage
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (err) {
      setError('Failed to load discovery data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await userProfileService.searchUsers(filters);
      setSearchResults(result.users);
      
      // Save search query to recent searches
      if (filters.query.trim()) {
        const newSearches = [filters.query, ...recentSearches.filter(s => s !== filters.query)].slice(0, 5);
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
  };

  const handleQuickSearch = (query: string) => {
    handleSearch({
      query,
      location: [],
      company: [],
      industry: [],
      skills: [],
      aiAgents: [],
      aiSkills: [],
      collaborationStyle: [],
      experienceLevel: '',
      collaborationRating: [0, 5],
      connectionLevel: '',
      isOnline: null,
      hasPublicProfile: null,
    });
  };

  const handleConnect = async (userId: string) => {
    try {
      await userProfileService.sendConnectionRequest(userId, 'Would love to connect and explore AI collaboration opportunities!');
      onConnect?.(userId);
    } catch (err) {
      console.error('Error sending connection request:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
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
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
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
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
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
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
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
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
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

