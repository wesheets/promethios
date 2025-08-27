/**
 * InAppNotificationPopup - Real-time notifications for conversation invitations
 * Appears as popup overlay to notify users of new invitations
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Avatar,
  IconButton,
  Slide,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  SmartToy as AIIcon,
  Check as AcceptIcon,
  Clear as DeclineIcon,
  Email as EmailIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';

export interface ConversationInvitationNotification {
  id: string;
  type: 'conversation_invitation';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  conversationId: string;
  conversationName: string;
  message?: string;
  participantCount: number;
  aiAgentCount: number;
  includeHistory: boolean;
  timestamp: Date;
  expiresAt: Date;
}

export interface InAppNotificationPopupProps {
  notifications: ConversationInvitationNotification[];
  onAcceptInvitation: (notificationId: string) => Promise<void>;
  onDeclineInvitation: (notificationId: string) => Promise<void>;
  onDismissNotification: (notificationId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const InAppNotificationPopup: React.FC<InAppNotificationPopupProps> = ({
  notifications,
  onAcceptInvitation,
  onDeclineInvitation,
  onDismissNotification,
  position = 'top-right'
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Auto-dismiss expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      notifications.forEach(notification => {
        if (notification.expiresAt <= now) {
          onDismissNotification(notification.id);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [notifications, onDismissNotification]);

  // Handle accept invitation
  const handleAccept = async (notificationId: string) => {
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await onAcceptInvitation(notificationId);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Handle decline invitation
  const handleDecline = async (notificationId: string) => {
    setProcessingIds(prev => new Set(prev).add(notificationId));
    try {
      await onDeclineInvitation(notificationId);
    } catch (error) {
      console.error('Failed to decline invitation:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Format time remaining
  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Expires soon';
  };

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9999,
      maxWidth: 400,
      maxHeight: '80vh',
      overflow: 'auto'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 20, right: 20 };
      case 'top-left':
        return { ...baseStyles, top: 20, left: 20 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 20, left: 20 };
      default:
        return { ...baseStyles, top: 20, right: 20 };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box sx={getPositionStyles()}>
      {notifications.map((notification, index) => {
        const isProcessing = processingIds.has(notification.id);
        const isExpired = notification.expiresAt <= new Date();

        return (
          <Slide
            key={notification.id}
            direction={position.includes('right') ? 'left' : 'right'}
            in={true}
            timeout={300}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <Paper
              elevation={8}
              sx={{
                bgcolor: '#1e293b',
                color: 'white',
                p: 3,
                mb: 2,
                border: '1px solid #3b82f6',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden',
                opacity: isExpired ? 0.6 : 1
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <NotificationIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ color: '#3b82f6', fontWeight: 600 }}>
                  Conversation Invitation
                </Typography>
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  onClick={() => onDismissNotification(notification.id)}
                  sx={{ color: '#94a3b8' }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              {/* From User */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', width: 40, height: 40 }}>
                  {notification.fromUserAvatar || notification.fromUserName.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {notification.fromUserName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                    invited you to join
                  </Typography>
                </Box>
              </Box>

              {/* Conversation Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                  "{notification.conversationName}"
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: 12 }} />}
                    label={`${notification.participantCount} humans`}
                    size="small"
                    sx={{ bgcolor: '#3b82f6', color: 'white', height: 20 }}
                  />
                  <Chip
                    icon={<AIIcon sx={{ fontSize: 12 }} />}
                    label={`${notification.aiAgentCount} AI agents`}
                    size="small"
                    sx={{ bgcolor: '#8b5cf6', color: 'white', height: 20 }}
                  />
                </Box>

                {notification.includeHistory && (
                  <Chip
                    label="Includes conversation history"
                    size="small"
                    sx={{ bgcolor: '#10b981', color: 'white', height: 20 }}
                  />
                )}
              </Box>

              {/* Custom Message */}
              {notification.message && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', mb: 0.5, display: 'block' }}>
                    Message:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#e2e8f0',
                    fontStyle: 'italic',
                    bgcolor: '#0f172a',
                    p: 1,
                    borderRadius: 1,
                    border: '1px solid #334155'
                  }}>
                    "{notification.message}"
                  </Typography>
                </Box>
              )}

              {/* Expiration Warning */}
              {isExpired ? (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    bgcolor: '#ef444420',
                    border: '1px solid #ef4444',
                    '& .MuiAlert-icon': { color: '#ef4444' },
                    '& .MuiAlert-message': { color: '#94a3b8' }
                  }}
                >
                  This invitation has expired
                </Alert>
              ) : (
                <Typography variant="caption" sx={{ color: '#f59e0b', mb: 2, display: 'block' }}>
                  ⏰ {formatTimeRemaining(notification.expiresAt)}
                </Typography>
              )}

              <Divider sx={{ bgcolor: '#334155', my: 2 }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => handleAccept(notification.id)}
                  disabled={isProcessing || isExpired}
                  variant="contained"
                  startIcon={<AcceptIcon />}
                  size="small"
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
                  }}
                >
                  {isProcessing ? 'Joining...' : 'Accept'}
                </Button>
                
                <Button
                  onClick={() => handleDecline(notification.id)}
                  disabled={isProcessing || isExpired}
                  variant="outlined"
                  startIcon={<DeclineIcon />}
                  size="small"
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': { borderColor: '#dc2626', bgcolor: '#ef444410' },
                    '&:disabled': { borderColor: '#374151', color: '#6b7280' }
                  }}
                >
                  Decline
                </Button>
              </Box>

              {/* Processing Overlay */}
              {isProcessing && (
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2
                }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    Processing...
                  </Typography>
                </Box>
              )}
            </Paper>
          </Slide>
        );
      })}
    </Box>
  );
};

export default InAppNotificationPopup;

