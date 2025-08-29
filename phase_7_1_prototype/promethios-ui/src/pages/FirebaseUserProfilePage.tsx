import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FirebaseUserDiscoveryService } from '../services/FirebaseUserDiscoveryService';
import { UserProfileService } from '../services/UserProfileService';
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

const FirebaseUserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionRequested, setConnectionRequested] = useState(false);

  const discoveryService = new FirebaseUserDiscoveryService();
  const profileService = new UserProfileService();

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load profile data from the same source as the edit page
        const userProfile = await profileService.getUserProfile(userId);
        
        if (userProfile) {
          setProfile(userProfile);
        } else {
          setError('User profile not found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setError('Failed to load user profile');
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleConnect = async () => {
    // TODO: Implement connection logic
    setConnectionRequested(true);
    console.log('Connection request sent to:', userId);
  };

  const handleMessage = () => {
    // TODO: Implement messaging logic
    console.log('Starting message with:', userId);
  };

  const handleBack = () => {
    navigate('/ui/social/discovery');
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
                background: profile.headerPhoto 
                  ? `url(${profile.headerPhoto}) center/cover`
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
                      backgroundColor: profile.isOnline ? '#4CAF50' : '#FFA726',
                      border: '3px solid white',
                    }}
                  />
                }
              >
                <Avatar 
                  src={profile.profilePhoto} 
                  sx={{ width: 120, height: 120, fontSize: '3rem' }}
                >
                  {profile.name?.charAt(0) || '?'}
                </Avatar>
              </Badge>
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600 }}>
                    {profile.name || 'Anonymous User'}
                  </Typography>
                  {profile.connectionStatus === 'connected' && (
                    <TeamMemberBadge variant="chip" size="medium" />
                  )}
                  {profile.rating >= 4.5 && (
                    <Verified sx={{ color: '#1976D2', fontSize: 28 }} />
                  )}
                  <Public sx={{ color: 'text.secondary', fontSize: 24 }} />
                </Box>
                
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.title || 'Professional'} at {profile.company || 'Company'}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body2">{profile.location || 'Remote'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Group fontSize="small" color="action" />
                    <Typography variant="body2">{profile.connections || 0} connections</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star fontSize="small" color="action" />
                    <Typography variant="body2">{(profile.rating || 4.0).toFixed(1)} rating</Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={handleConnect}
                    disabled={connectionRequested || profile.id === currentUser?.uid}
                  >
                    {connectionRequested ? 'Request Sent' : 'Connect'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Message />}
                    onClick={handleMessage}
                    disabled={profile.id === currentUser?.uid}
                  >
                    Message
                  </Button>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* About Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                About
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {profile.about || 'Professional focused on AI collaboration and innovation.'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* AI Collaborators Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy />
                AI Collaborators
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(profile.aiAgents || []).map((agent: any, index: number) => (
                  <Tooltip key={agent.id || index} title={`${agent.name} - ${agent.specialization?.join(', ') || 'AI Assistant'}`}>
                    <Chip
                      icon={<SmartToy />}
                      label={agent.name || agent.type || 'AI'}
                      sx={{
                        backgroundColor: getAIAgentColor(agent.type || 'Assistant'),
                        color: 'white',
                        fontWeight: 500,
                      }}
                    />
                  </Tooltip>
                ))}
                {(profile.aiAgents || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No AI collaborators listed
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Skills Section */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Skills & Expertise
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(profile.skills || []).map((skill: string, index: number) => (
                  <Chip
                    key={index}
                    label={skill}
                    variant="outlined"
                    sx={{ borderColor: 'primary.main', color: 'primary.main' }}
                  />
                ))}
                {(profile.skills || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No skills listed
                  </Typography>
                )}
              </Box>
            </Box>
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
  );
};

export default FirebaseUserProfilePage;

