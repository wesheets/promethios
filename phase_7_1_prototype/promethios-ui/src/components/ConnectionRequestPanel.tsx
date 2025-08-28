import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PersonAdd,
  Check,
  Close,
  Schedule,
  Group,
  Star
} from '@mui/icons-material';
import { useConnections } from '../hooks/useConnections';
import { ConnectionRequest } from '../services/FirebaseConnectionService';

interface ConnectionRequestPanelProps {
  onViewProfile?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
}

export const ConnectionRequestPanel: React.FC<ConnectionRequestPanelProps> = ({
  onViewProfile,
  onStartChat
}) => {
  const {
    pendingRequests,
    acceptConnectionRequest,
    declineConnectionRequest,
    acceptingRequest,
    decliningRequest,
    loading,
    error
  } = useConnections();

  const handleAccept = async (requestId: string, fromUserId: string) => {
    const success = await acceptConnectionRequest(requestId);
    if (success && onStartChat) {
      // Optionally start a chat with the newly connected user
      setTimeout(() => onStartChat(fromUserId), 1000);
    }
  };

  const handleDecline = async (requestId: string) => {
    await declineConnectionRequest(requestId);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return time.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
        <PersonAdd sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Connection Requests
        </Typography>
        <Typography variant="body2" color="text.secondary">
          When people want to connect with you, their requests will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Connection Requests ({pendingRequests.length})
      </Typography>

      <Stack spacing={2}>
        {pendingRequests.map((request) => (
          <Card key={request.id} sx={{ position: 'relative' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* User Avatar */}
                <Avatar
                  src={request.fromUserPhoto}
                  alt={request.fromUserName}
                  sx={{ width: 56, height: 56 }}
                  onClick={() => onViewProfile?.(request.fromUserId)}
                  style={{ cursor: 'pointer' }}
                >
                  {request.fromUserName.charAt(0).toUpperCase()}
                </Avatar>

                {/* Request Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => onViewProfile?.(request.fromUserId)}
                    >
                      {request.fromUserName}
                    </Typography>
                    
                    <Chip
                      icon={<Schedule />}
                      label={formatTimeAgo(request.createdAt)}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>

                  {/* User Title/Company */}
                  {request.metadata?.fromUserTitle && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {request.metadata.fromUserTitle}
                      {request.metadata.fromUserCompany && ` at ${request.metadata.fromUserCompany}`}
                    </Typography>
                  )}

                  {/* Connection Message */}
                  <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {request.message}
                  </Typography>

                  {/* Mutual Connections & Common Skills */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    {request.metadata?.mutualConnections && request.metadata.mutualConnections > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {request.metadata.mutualConnections} mutual connection{request.metadata.mutualConnections !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    )}

                    {request.metadata?.commonSkills && request.metadata.commonSkills.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {request.metadata.commonSkills.length} common skill{request.metadata.commonSkills.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Common Skills Chips */}
                  {request.metadata?.commonSkills && request.metadata.commonSkills.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                        Common Skills:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {request.metadata.commonSkills.slice(0, 3).map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ))}
                        {request.metadata.commonSkills.length > 3 && (
                          <Chip
                            label={`+${request.metadata.commonSkills.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Check />}
                      onClick={() => handleAccept(request.id, request.fromUserId)}
                      disabled={acceptingRequest || decliningRequest}
                      sx={{ minWidth: 120 }}
                    >
                      {acceptingRequest ? 'Accepting...' : 'Accept'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Close />}
                      onClick={() => handleDecline(request.id)}
                      disabled={acceptingRequest || decliningRequest}
                      sx={{ minWidth: 100 }}
                    >
                      {decliningRequest ? 'Declining...' : 'Decline'}
                    </Button>

                    <Button
                      variant="text"
                      onClick={() => onViewProfile?.(request.fromUserId)}
                      sx={{ ml: 'auto' }}
                    >
                      View Profile
                    </Button>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default ConnectionRequestPanel;

