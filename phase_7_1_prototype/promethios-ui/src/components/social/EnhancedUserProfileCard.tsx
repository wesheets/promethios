/**
 * Enhanced User Profile Card
 * 
 * User profile card with integrated connection requests and chat invitations
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  PersonAdd,
  Message,
  Check,
  Schedule,
  Block
} from '@mui/icons-material';
import UserConnectionHandler from './UserConnectionHandler';

interface UserProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
  connectionStatus: 'none' | 'pending' | 'connected' | 'blocked';
  isConnected: boolean;
}

interface EnhancedUserProfileCardProps {
  profile: UserProfile;
  onViewProfile?: (userId: string) => void;
}

const EnhancedUserProfileCard: React.FC<EnhancedUserProfileCardProps> = ({
  profile,
  onViewProfile
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const getConnectionButtonProps = () => {
    switch (profile.connectionStatus) {
      case 'connected':
        return {
          text: 'Connected',
          icon: <Check />,
          color: 'success' as const,
          disabled: true
        };
      case 'pending':
        return {
          text: 'Pending',
          icon: <Schedule />,
          color: 'warning' as const,
          disabled: true
        };
      case 'blocked':
        return {
          text: 'Blocked',
          icon: <Block />,
          color: 'error' as const,
          disabled: true
        };
      default:
        return {
          text: 'Connect',
          icon: <PersonAdd />,
          color: 'primary' as const,
          disabled: false
        };
    }
  };

  return (
    <UserConnectionHandler>
      {({ sendConnectionRequest, sendChatInvitation, isConnected, hasPendingRequest }) => {
        const connectionProps = getConnectionButtonProps();
        const isPending = hasPendingRequest(profile.id);
        const userIsConnected = isConnected(profile.id);

        const handleConnect = async () => {
          setLoading(true);
          try {
            const success = await sendConnectionRequest(
              profile.id,
              `Hi ${profile.name}! I'd like to connect and explore collaboration opportunities.`
            );
            
            if (success) {
              showSnackbar('Connection request sent successfully!', 'success');
            } else {
              showSnackbar('Failed to send connection request. Please try again.', 'error');
            }
          } catch (error) {
            showSnackbar('An error occurred. Please try again.', 'error');
          } finally {
            setLoading(false);
          }
        };

        const handleMessage = async () => {
          setLoading(true);
          try {
            const success = await sendChatInvitation(
              profile.id,
              `Hi ${profile.name}! Would you like to start a conversation?`
            );
            
            if (success) {
              showSnackbar('Chat invitation sent successfully!', 'success');
            } else {
              showSnackbar('Failed to send chat invitation. Please try again.', 'error');
            }
          } catch (error) {
            showSnackbar('An error occurred. Please try again.', 'error');
          } finally {
            setLoading(false);
          }
        };

        return (
          <>
            <Card sx={{ maxWidth: 400, m: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={profile.avatar}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  >
                    {profile.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="h2">
                      {profile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {profile.company}
                    </Typography>
                  </Box>
                </Box>

                {/* Connection Status */}
                {(userIsConnected || isPending || profile.connectionStatus !== 'none') && (
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      label={
                        userIsConnected ? 'Connected' :
                        isPending ? 'Request Pending' :
                        profile.connectionStatus === 'pending' ? 'Pending' :
                        profile.connectionStatus === 'connected' ? 'Connected' :
                        'Not Connected'
                      }
                      color={
                        userIsConnected || profile.connectionStatus === 'connected' ? 'success' :
                        isPending || profile.connectionStatus === 'pending' ? 'warning' :
                        'default'
                      }
                    />
                  </Box>
                )}

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    color={connectionProps.color}
                    startIcon={loading ? <CircularProgress size={16} /> : connectionProps.icon}
                    onClick={handleConnect}
                    disabled={
                      loading || 
                      connectionProps.disabled || 
                      userIsConnected || 
                      isPending ||
                      profile.connectionStatus === 'pending' ||
                      profile.connectionStatus === 'connected'
                    }
                    sx={{ flex: 1 }}
                  >
                    {userIsConnected ? 'Connected' :
                     isPending ? 'Request Sent' :
                     connectionProps.text}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={loading ? <CircularProgress size={16} /> : <Message />}
                    onClick={handleMessage}
                    disabled={loading}
                    sx={{ flex: 1 }}
                  >
                    Message
                  </Button>
                </Box>

                {/* View Profile Button */}
                {onViewProfile && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onViewProfile(profile.id)}
                    sx={{ mt: 1, width: '100%' }}
                  >
                    View Full Profile
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Snackbar for feedback */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={4000}
              onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            >
              <Alert
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                severity={snackbar.severity}
                sx={{ width: '100%' }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </>
        );
      }}
    </UserConnectionHandler>
  );
};

export default EnhancedUserProfileCard;

