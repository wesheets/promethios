import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FirebaseUserDiscoveryService } from '../services/FirebaseUserDiscoveryService';
import { UserProfileService } from '../services/UserProfileService';
import { ConnectionService } from '../services/ConnectionService';
import {
  Box,
  Card,
  Typography,
  Grid,
  Button,
  Avatar,
  CircularProgress,
  Divider,
  Chip,
  Stack,
  Badge,
  Tooltip,
  Alert,
  Paper
} from '@mui/material';
import {
  Person,
  Email,
  Business,
  LocationOn,
  Star,
  Group,
  Message,
  PersonAdd,
  ArrowBack,
  SmartToy,
  Psychology,
  AutoAwesome,
  Verified,
  Public,
  Schedule
} from '@mui/icons-material';
import TeamMemberBadge from '../components/social/TeamMemberBadge';
import UserConnectionsModal from '../components/social/UserConnectionsModal';
import ErrorBoundary from '../components/ErrorBoundary';

const FirebaseUserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const connectionService = ConnectionService.getInstance();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionRequested, setConnectionRequested] = useState(false);
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [realConnectionCount, setRealConnectionCount] = useState<number>(0);

  const discoveryService = new FirebaseUserDiscoveryService();
  const profileService = new UserProfileService();

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        console.error('❌ FirebaseUserProfilePage: No userId provided');
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 FirebaseUserProfilePage: Loading profile for userId:', userId);
        setLoading(true);
        
        // Load profile data and connection count in parallel
        const [userProfile, connectionCount] = await Promise.all([
          profileService.getUserProfile(userId),
          loadConnectionCount(userId)
        ]);
        
        console.log('📊 FirebaseUserProfilePage: Profile data received:', userProfile);
        console.log('🔗 FirebaseUserProfilePage: Connection count:', connectionCount);
        
        if (userProfile) {
          console.log('✅ FirebaseUserProfilePage: Profile found, setting state');
          setProfile(userProfile);
          setRealConnectionCount(connectionCount);
        } else {
          console.error('❌ FirebaseUserProfilePage: No profile found for userId:', userId);
          setError('User profile not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('💥 FirebaseUserProfilePage: Failed to load user profile:', error);
        setError('Failed to load user profile');
        setLoading(false);
      }
    };

    const loadConnectionCount = async (userId: string): Promise<number> => {
      try {
        const connections = await connectionService.getUserConnections(userId);
        return connections.length;
      } catch (error) {
        console.error('Failed to load connection count:', error);
        return 0;
      }
    };

    loadProfile();
  }, [userId]);

  const handleConnect = async () => {
    if (!currentUser) {
      console.error('❌ [Connection] No current user found');
      return;
    }

    if (!profile) {
      console.error('❌ [Connection] No profile data found');
      return;
    }

    try {
      console.log('🤝 [Connection] Sending connection request to:', userId);
      
      // Get current user's profile to get their actual Promethios profile photo
      const currentUserProfile = await userProfileService.getUserProfile(currentUser.uid);
      
      // Get current user's name and avatar from their Promethios profile or auth
      const fromUserName = currentUserProfile?.name || currentUserProfile?.displayName || currentUser.displayName || currentUser.email || 'Anonymous User';
      const fromUserAvatar = currentUserProfile?.profilePhoto || currentUserProfile?.avatar || currentUser.photoURL || undefined;
      
      // Get target user's name from profile
      const toUserName = profile.name || profile.displayName || 'Anonymous User';
      
      await connectionService.sendConnectionRequest(
        currentUser.uid,
        userId!,
        fromUserName,
        toUserName,
        fromUserAvatar,
        profile.profilePhoto || profile.avatar || profile.photoURL || undefined,
        `Hi! I'd like to connect with you on Promethios.`
      );
      
      setConnectionRequested(true);
      console.log('✅ [Connection] Connection request sent successfully');
      
    } catch (error) {
      console.error('❌ [Connection] Failed to send connection request:', error);
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging logic
    console.log('Starting message with:', userId);
  };

  const handleConnectionsClick = () => {
    setConnectionsModalOpen(true);
  };

  const refreshConnectionCount = async () => {
    if (userId) {
      try {
        const connections = await connectionService.getUserConnections(userId);
        setRealConnectionCount(connections.length);
      } catch (error) {
        console.error('Failed to refresh connection count:', error);
      }
    }
  };

  const handleBack = () => {
    navigate('/ui/social/discovery');
  };

  // Safety function to ensure we never render objects as React elements
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // If it's an object, try to extract a meaningful string
      return value.name || value.title || value.label || JSON.stringify(value);
    }
    return String(value);
  };

  const getAIAgentColor = (type: string) => {
    const colors = {
      'Claude': '#FF6B35',
      'ChatGPT': '#10A37F',
      'OpenAI': '#10A37F',
      'Gemini': '#4285F4',
      'Assistant': '#6366F1',
      'Custom': '#8B5CF6'
    };
    return colors[type as keyof typeof colors] || '#6366F1';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ mb: 3 }}
        >
          Back to Discovery
        </Button>
        <Alert severity="error">
          {error || 'Profile not found'}
        </Alert>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back to Discovery
      </Button>

      <Grid container spacing={3}>
        {/* Main Profile Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 0, mb: 3, overflow: 'hidden' }}>
            {/* Header Photo */}
            <Box
              sx={{
                height: 200,
                background: (profile?.headerPhoto || profile?.headerImage)
                  ? `url(${profile.headerPhoto || profile.headerImage}) center/cover`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                p: 3
              }}
            />
            
            {/* Profile Content */}
            <Box sx={{ p: 4, pt: 2 }}>
            {/* Profile Header */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: (profile?.isOnline) ? '#4CAF50' : '#FFA726',
                      border: '3px solid white',
                    }}
                  />
                }
              >
                <Avatar 
                  src={profile?.profilePhoto || profile?.avatar || profile?.photoURL} 
                  sx={{ width: 120, height: 120, fontSize: '3rem' }}
                >
                  {profile?.name?.charAt(0) || profile?.displayName?.charAt(0) || '?'}
                </Avatar>
              </Badge>
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {safeRender(profile?.name || profile?.displayName || 'Anonymous User')}
                  </Typography>
                  {profile?.connectionStatus === 'connected' && (
                    <TeamMemberBadge variant="chip" size="medium" />
                  )}
                  {(profile?.rating || 0) >= 4.5 && (
                    <Verified sx={{ color: '#1976D2', fontSize: 28 }} />
                  )}
                  <Public sx={{ color: 'text.secondary', fontSize: 24 }} />
                </Box>
                
                {(profile?.title || profile?.company) && (
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    {profile?.title && profile?.company ? `${safeRender(profile.title)} at ${safeRender(profile.company)}` : 
                     profile?.title ? safeRender(profile.title) : 
                     profile?.company ? `Professional at ${safeRender(profile.company)}` : ''}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  {profile?.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" color="action" />
                      <Typography variant="body2">{safeRender(profile.location)}</Typography>
                    </Box>
                  )}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        color: 'primary.main',
                        '& .MuiSvgIcon-root': {
                          color: 'primary.main'
                        }
                      }
                    }}
                    onClick={handleConnectionsClick}
                  >
                    <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {realConnectionCount} connection{realConnectionCount !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  {profile?.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Star sx={{ fontSize: 16, color: '#FFA726' }} />
                      <Typography variant="body2">{profile.rating.toFixed(1)} rating</Typography>
                    </Box>
                  )}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleConnect}
                    disabled={connectionRequested || profile?.id === currentUser?.uid}
                  >
                    {connectionRequested ? 'Request Sent' : 'Connect'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    onClick={handleMessage}
                    disabled={profile?.id === currentUser?.uid}
                  >
                    Message
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* About Section */}
            {profile?.about && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  About
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {safeRender(profile.about)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* AI Collaborators Section */}
            {(profile.aiAgents || []).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SmartToy />
                  AI Collaborators
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(profile.aiAgents || []).map((agent: any, index: number) => (
                    <Tooltip key={agent?.id || index} title={`${safeRender(agent?.name || agent?.type || 'AI')} - ${safeRender(agent?.specialization?.join?.(', ') || 'AI Assistant')}`}>
                      <Chip
                        icon={<SmartToy />}
                        label={safeRender(agent?.name || agent?.type || 'AI')}
                        sx={{
                          backgroundColor: getAIAgentColor(agent?.type || 'Assistant'),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Skills Section */}
            {(profile.skills || []).length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Skills & Expertise
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(profile.skills || []).map((skill: any, index: number) => (
                    <Chip
                      key={index}
                      label={safeRender(skill)}
                      variant="outlined"
                      sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            </Box>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Activity Status */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Activity Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: profile.isOnline ? '#4CAF50' : '#FFA726',
                }}
              />
              <Typography variant="body2">
                {profile.isOnline ? 'Online now' : 'Recently active'}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Response time: {profile.responseTime || 15} minutes
            </Typography>
          </Paper>

          {/* Collaboration Stats */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Collaboration Stats
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Collaborations</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {profile.collaborations || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star fontSize="small" color="primary" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {(profile.rating || 4.0).toFixed(1)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Experience Level</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {profile.experienceLevel || 'Intermediate'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Industry */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Industry
            </Typography>
            <Chip
              label={profile.industry || 'Technology'}
              color="primary"
              variant="outlined"
            />
          </Paper>
        </Grid>
      </Grid>
      </Box>

      {/* User Connections Modal */}
      <UserConnectionsModal
        open={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        userId={userId || ''}
        userName={profile?.name || profile?.displayName}
      />
    </ErrorBoundary>
  );
};

export default FirebaseUserProfilePage;

