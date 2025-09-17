import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Badge
} from '@mui/material';
import {
  Person,
  Business,
  LocationOn,
  Star,
  Group,
  Close,
  Check,
  SmartToy,
  Verified,
  Public
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';
import { NavigationService } from '../../services/NavigationService';
import { UserProfileService } from '../../services/UserProfileService';

interface ConnectionRequestModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  onAccept?: () => void;
  onReject?: () => void;
}

const ConnectionRequestModal: React.FC<ConnectionRequestModalProps> = ({
  open,
  onClose,
  requestId,
  fromUserId,
  fromUserName,
  fromUserAvatar,
  onAccept,
  onReject
}) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const connectionService = ConnectionService.getInstance();
  const profileService = new UserProfileService();

  useEffect(() => {
    if (open && fromUserId) {
      loadUserProfile();
    }
  }, [open, fromUserId]);

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true);
      setError(null);
      
      const userProfile = await profileService.getUserProfile(fromUserId);
      if (userProfile) {
        setProfile(userProfile);
      } else {
        // Fallback to basic info if profile not found
        setProfile({
          name: fromUserName,
          displayName: fromUserName,
          profilePhoto: fromUserAvatar,
          about: 'No additional profile information available.',
          connections: 0,
          rating: 4.0,
          experienceLevel: 'Unknown'
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setError('Failed to load profile information');
      // Set basic fallback profile
      setProfile({
        name: fromUserName,
        displayName: fromUserName,
        profilePhoto: fromUserAvatar,
        about: 'Profile information unavailable.',
        connections: 0,
        rating: 4.0,
        experienceLevel: 'Unknown'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      await connectionService.acceptConnectionRequest(requestId);
      
      if (onAccept) {
        onAccept();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to accept connection request:', error);
      setError('Failed to accept connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await connectionService.rejectConnectionRequest(requestId);
      
      if (onReject) {
        onReject();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to reject connection request:', error);
      setError('Failed to reject connection request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = () => {
    // Navigate to the sender's profile page using NavigationService
    const navigationService = NavigationService.getInstance();
    navigationService.navigateToProfile(fromUserId, { openInNewTab: true });
  };

  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Connection Request
          </Typography>
          <Button
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1 }}
            color="inherit"
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {profileLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : profile ? (
          <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              {/* Profile Header */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: profile?.isOnline ? '#4CAF50' : '#FFA726',
                        border: '2px solid white',
                      }}
                    />
                  }
                >
                  <Avatar 
                    src={profile?.profilePhoto || profile?.avatar || fromUserAvatar} 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      fontSize: '2rem',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out'
                      }
                    }}
                    onClick={() => handleViewProfile()}
                  >
                    {(profile?.name || fromUserName)?.charAt(0) || '?'}
                  </Avatar>
                </Badge>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={() => handleViewProfile()}
                    >
                      {safeRender(profile?.name || profile?.displayName || fromUserName)}
                    </Typography>
                    {(profile?.rating || 0) >= 4.5 && (
                      <Verified sx={{ color: '#1976D2', fontSize: 20 }} />
                    )}
                    <Public sx={{ color: 'text.secondary', fontSize: 18 }} />
                  </Box>
                  
                  {(profile?.title || profile?.company) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {profile?.title && profile?.company ? `${safeRender(profile.title)} at ${safeRender(profile.company)}` : 
                       profile?.title ? safeRender(profile.title) : 
                       profile?.company ? `Professional at ${safeRender(profile.company)}` : ''}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {profile?.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">{safeRender(profile.location)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Group sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2">{profile?.connections || 0} connections</Typography>
                    </Box>
                    {profile?.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 14, color: '#FFA726' }} />
                        <Typography variant="body2">{profile.rating.toFixed(1)} rating</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* About Section */}
              {profile?.about && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    About
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.5, mb: 2 }}>
                    {safeRender(profile.about)}
                  </Typography>
                </>
              )}

              {/* AI Collaborators */}
              {(profile?.aiAgents || []).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SmartToy fontSize="small" />
                    AI Collaborators
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(profile.aiAgents || []).slice(0, 3).map((agent: any, index: number) => (
                      <Chip
                        key={agent?.id || index}
                        size="small"
                        icon={<SmartToy />}
                        label={safeRender(agent?.name || agent?.type || 'AI')}
                        sx={{
                          backgroundColor: getAIAgentColor(agent?.type || 'Assistant'),
                          color: 'white',
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                    {(profile.aiAgents || []).length > 3 && (
                      <Chip
                        size="small"
                        label={`+${(profile.aiAgents || []).length - 3} more`}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </>
              )}

              {/* Skills */}
              {(profile?.skills || []).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Skills & Expertise
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(profile.skills || []).slice(0, 4).map((skill: any, index: number) => (
                      <Chip
                        key={index}
                        size="small"
                        label={safeRender(skill)}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                    {(profile.skills || []).length > 4 && (
                      <Chip
                        size="small"
                        label={`+${(profile.skills || []).length - 4} more`}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        ) : null}

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          {fromUserName} wants to connect with you on Promethios
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            onClick={handleReject}
            variant="outlined"
            color="inherit"
            disabled={loading}
            startIcon={<Close />}
            sx={{ flex: 1 }}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Check />}
            sx={{ flex: 1 }}
          >
            {loading ? 'Accepting...' : 'Accept'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionRequestModal;

