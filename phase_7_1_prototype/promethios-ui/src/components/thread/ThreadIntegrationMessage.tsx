/**
 * ThreadIntegrationMessage - Special message type for displaying thread summaries in main chat
 */

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  Divider,
  useTheme
} from '@mui/material';
import {
  Forum as ForumIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Message as MessageIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { ThreadIntegrationMessage as ThreadIntegrationMessageType, ThreadMessage } from '../../types/Thread';

interface ThreadIntegrationMessageProps {
  integrationMessage: ThreadIntegrationMessageType;
  onOpenThread?: (threadId: string) => void;
  participants?: Array<{
    id: string;
    name: string;
    type: 'user' | 'ai_agent';
    color?: string;
  }>;
}

export const ThreadIntegrationMessage: React.FC<ThreadIntegrationMessageProps> = ({
  integrationMessage,
  onOpenThread,
  participants
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const [expanded, setExpanded] = useState(false);

  const { threadReference, integrationData } = integrationMessage;

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getParticipantColor = (participantId: string): string => {
    const participant = participants?.find(p => p.id === participantId);
    if (participant?.color) return participant.color;
    
    // Default color generation
    const colors = [
      '#f97316', '#3b82f6', '#10b981', '#8b5cf6', 
      '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'
    ];
    const index = participantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleOpenThread = () => {
    if (onOpenThread) {
      onOpenThread(threadReference.threadId);
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderLeft: '4px solid #10b981',
        borderRadius: 2
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
        <Avatar
          sx={{
            bgcolor: '#10b981',
            width: 32,
            height: 32
          }}
        >
          <CheckCircleIcon sx={{ fontSize: '18px' }} />
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <ForumIcon sx={{ color: '#10b981', fontSize: '16px' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#10b981' }}>
              Thread Resolved
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              by {threadReference.resolvedBy} • {formatTimestamp(integrationMessage.timestamp)}
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
            {integrationData.summary}
          </Typography>

          {/* Thread Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={<MessageIcon />}
              label={`${threadReference.originalMessageCount} messages`}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            <Chip
              icon={<PersonIcon />}
              label={`${threadReference.participants.length} participants`}
              size="small"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            />
            {onOpenThread && (
              <Chip
                label="View Thread"
                size="small"
                clickable
                onClick={handleOpenThread}
                sx={{
                  bgcolor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  '&:hover': {
                    bgcolor: 'rgba(59, 130, 246, 0.2)'
                  }
                }}
              />
            )}
          </Box>

          {/* Key Points */}
          {integrationData.keyPoints.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
                KEY OUTCOMES:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {integrationData.keyPoints.map((point, index) => (
                  <Chip
                    key={index}
                    label={point}
                    size="small"
                    sx={{
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      fontSize: '11px',
                      height: 24
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Expandable Key Messages */}
          {integrationData.keyMessages.length > 0 && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  py: 0.5,
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                  },
                  borderRadius: 1
                }}
                onClick={() => setExpanded(!expanded)}
              >
                <IconButton size="small">
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                  KEY MESSAGES ({integrationData.keyMessages.length})
                </Typography>
              </Box>

              <Collapse in={expanded}>
                <Box sx={{ mt: 1, pl: 2 }}>
                  {integrationData.keyMessages.map((message, index) => (
                    <Box key={message.id} sx={{ mb: 2 }}>
                      {index > 0 && <Divider sx={{ mb: 2 }} />}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: getParticipantColor(message.senderId),
                            fontSize: '10px',
                            fontWeight: 600
                          }}
                        >
                          {message.senderName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                fontSize: '11px',
                                color: getParticipantColor(message.senderId)
                              }}
                            >
                              {message.senderName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '10px', color: theme.palette.text.secondary }}>
                              {formatTimestamp(message.timestamp)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '12px', lineHeight: 1.4 }}>
                            {message.content}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ThreadIntegrationMessage;

