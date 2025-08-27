/**
 * AgentPermissionRequestPopup - Shows permission requests for AI agent additions
 * Displays requests to chat owners and responses to requesters
 */

import React, { useState } from 'react';
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
  TextField,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  Check as ApproveIcon,
  Clear as DenyIcon,
  Security as SecurityIcon,
  Schedule as PendingIcon
} from '@mui/icons-material';
import { PermissionNotification } from '../../services/AgentPermissionService';

export interface AgentPermissionRequestPopupProps {
  notifications: PermissionNotification[];
  onApproveRequest: (requestId: string, reason?: string) => Promise<void>;
  onDenyRequest: (requestId: string, reason?: string) => Promise<void>;
  onDismissNotification: (notificationId: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const AgentPermissionRequestPopup: React.FC<AgentPermissionRequestPopupProps> = ({
  notifications,
  onApproveRequest,
  onDenyRequest,
  onDismissNotification,
  position = 'top-right'
}) => {
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [denyReasons, setDenyReasons] = useState<Map<string, string>>(new Map());
  const [showDenyReason, setShowDenyReason] = useState<string | null>(null);

  // Handle approve request
  const handleApprove = async (notification: PermissionNotification) => {
    const requestId = notification.id.replace('notif_', '');
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      await onApproveRequest(requestId);
    } catch (error) {
      console.error('Failed to approve agent request:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  // Handle deny request
  const handleDeny = async (notification: PermissionNotification, reason?: string) => {
    const requestId = notification.id.replace('notif_', '');
    setProcessingIds(prev => new Set(prev).add(notification.id));
    
    try {
      await onDenyRequest(requestId, reason);
      setShowDenyReason(null);
      setDenyReasons(prev => {
        const newMap = new Map(prev);
        newMap.delete(notification.id);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to deny agent request:', error);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  // Get position styles
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 9998, // Below conversation notifications
      maxWidth: 400,
      maxHeight: '80vh',
      overflow: 'auto'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: 20, right: 440 }; // Offset from conversation notifications
      case 'top-left':
        return { ...baseStyles, top: 20, left: 20 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 20, right: 20 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 20, left: 20 };
      default:
        return { ...baseStyles, top: 20, right: 440 };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <Box sx={getPositionStyles()}>
      {notifications.map((notification, index) => {
        const isProcessing = processingIds.has(notification.id);
        const isRequest = notification.type === 'agent_permission_request';
        const isResponse = notification.type === 'agent_permission_response';
        const showingDenyReason = showDenyReason === notification.id;

        return (
          <Slide
            key={notification.id}
            direction="left"
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
                border: isRequest ? '1px solid #f59e0b' : '1px solid #3b82f6',
                borderRadius: 2,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {isRequest ? (
                  <SecurityIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                ) : (
                  <PendingIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
                )}
                <Typography variant="subtitle2" sx={{ 
                  color: isRequest ? '#f59e0b' : '#3b82f6', 
                  fontWeight: 600 
                }}>
                  {isRequest ? 'AI Agent Permission Request' : 'Permission Response'}
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

              {/* Request Content */}
              {isRequest && (
                <>
                  {/* Requester Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {notification.fromUserName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        wants to add an AI agent
                      </Typography>
                    </Box>
                  </Box>

                  {/* Agent Info */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AIIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                      <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                        {notification.agentName}
                      </Typography>
                      <Chip
                        label={notification.agentType}
                        size="small"
                        sx={{ bgcolor: '#8b5cf6', color: 'white', height: 20 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      to "{notification.conversationName}"
                    </Typography>
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

                  <Divider sx={{ bgcolor: '#334155', my: 2 }} />

                  {/* Deny Reason Input */}
                  {showingDenyReason && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        placeholder="Optional reason for denial..."
                        value={denyReasons.get(notification.id) || ''}
                        onChange={(e) => {
                          setDenyReasons(prev => {
                            const newMap = new Map(prev);
                            newMap.set(notification.id, e.target.value);
                            return newMap;
                          });
                        }}
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#0f172a',
                            color: 'white',
                            '& fieldset': { borderColor: '#475569' },
                            '&:hover fieldset': { borderColor: '#ef4444' },
                            '&.Mui-focused fieldset': { borderColor: '#ef4444' }
                          }
                        }}
                      />
                    </Box>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => handleApprove(notification)}
                      disabled={isProcessing}
                      variant="contained"
                      startIcon={<ApproveIcon />}
                      size="small"
                      sx={{
                        bgcolor: '#10b981',
                        '&:hover': { bgcolor: '#059669' },
                        '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
                      }}
                    >
                      Approve
                    </Button>
                    
                    {showingDenyReason ? (
                      <>
                        <Button
                          onClick={() => handleDeny(notification, denyReasons.get(notification.id))}
                          disabled={isProcessing}
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: '#ef4444',
                            '&:hover': { bgcolor: '#dc2626' },
                            '&:disabled': { bgcolor: '#374151', color: '#6b7280' }
                          }}
                        >
                          Confirm Deny
                        </Button>
                        <Button
                          onClick={() => setShowDenyReason(null)}
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#6b7280',
                            color: '#6b7280',
                            '&:hover': { borderColor: '#94a3b8' }
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => setShowDenyReason(notification.id)}
                        disabled={isProcessing}
                        variant="outlined"
                        startIcon={<DenyIcon />}
                        size="small"
                        sx={{
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          '&:hover': { borderColor: '#dc2626', bgcolor: '#ef444410' },
                          '&:disabled': { borderColor: '#374151', color: '#6b7280' }
                        }}
                      >
                        Deny
                      </Button>
                    )}
                  </Box>
                </>
              )}

              {/* Response Content */}
              {isResponse && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                      <PersonIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                        {notification.fromUserName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        responded to your request
                      </Typography>
                    </Box>
                  </Box>

                  <Alert
                    severity={notification.status === 'approved' ? 'success' : 'error'}
                    sx={{
                      mb: 2,
                      bgcolor: notification.status === 'approved' ? '#10b98120' : '#ef444420',
                      border: `1px solid ${notification.status === 'approved' ? '#10b981' : '#ef4444'}`,
                      '& .MuiAlert-icon': { 
                        color: notification.status === 'approved' ? '#10b981' : '#ef4444' 
                      },
                      '& .MuiAlert-message': { color: '#94a3b8' }
                    }}
                  >
                    Your request to add {notification.agentName} was {notification.status}
                    {notification.message && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        "{notification.message}"
                      </Typography>
                    )}
                  </Alert>
                </>
              )}

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

export default AgentPermissionRequestPopup;

