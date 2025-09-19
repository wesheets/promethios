/**
 * HumanMessagingPanel - Human-to-human messaging interface
 * Based on command center messaging but adapted for human conversations
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Avatar,
  Divider,
  Slide,
  useTheme,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

import HumanMessagingInterface from './HumanMessagingInterface';

interface HumanMessagingPanelProps {
  open: boolean;
  onClose: () => void;
  width: string;
  conversationType: 'channel' | 'direct_message';
  conversationId: string;
  conversationName: string;
  participants?: Array<{
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  }>;
}

const HumanMessagingPanel: React.FC<HumanMessagingPanelProps> = ({
  open,
  onClose,
  width,
  conversationType,
  conversationId,
  conversationName,
  participants = []
}) => {
  const theme = useTheme();

  return (
    <Slide direction="left" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: '56px', // Start below AgentDocker
          right: 0,
          width: width,
          height: 'calc(100vh - 56px)', // Adjust height to account for docker
          bgcolor: '#0f172a',
          borderLeft: '1px solid #334155',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#1e293b'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Conversation Icon */}
            <Avatar
              sx={{
                bgcolor: conversationType === 'channel' ? '#6366f1' : '#10b981',
                width: 40,
                height: 40
              }}
            >
              {conversationType === 'channel' ? (
                <GroupIcon />
              ) : (
                <PersonIcon />
              )}
            </Avatar>

            {/* Conversation Info */}
            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: '#f8fafc',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                {conversationName}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#94a3b8',
                  fontSize: '0.8rem'
                }}
              >
                {conversationType === 'channel' 
                  ? `${participants.length} members`
                  : participants.length > 0 
                    ? participants[0].isOnline ? 'Online' : 'Offline'
                    : 'Direct Message'
                }
              </Typography>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Participants Avatars (for channels) */}
            {conversationType === 'channel' && participants.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
                {participants.slice(0, 3).map((participant, index) => (
                  <Tooltip key={participant.id} title={participant.name}>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        participant.isOnline ? (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: '#10b981',
                              border: '1px solid #1e293b'
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar
                        src={participant.avatar}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: '0.7rem',
                          bgcolor: '#475569'
                        }}
                      >
                        {participant.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </Tooltip>
                ))}
                {participants.length > 3 && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      ml: 0.5,
                      fontSize: '0.7rem'
                    }}
                  >
                    +{participants.length - 3}
                  </Typography>
                )}
              </Box>
            )}

            <IconButton
              size="small"
              sx={{ color: '#94a3b8' }}
            >
              <MoreIcon />
            </IconButton>

            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: '#94a3b8' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Messaging Interface */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <HumanMessagingInterface
            conversationType={conversationType}
            conversationId={conversationId}
            participants={participants}
          />
        </Box>
      </Box>
    </Slide>
  );
};

export default HumanMessagingPanel;

