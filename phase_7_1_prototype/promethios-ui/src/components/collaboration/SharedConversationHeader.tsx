/**
 * SharedConversationHeader - Header component for shared conversations
 * Shows collaboration status and participant information
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
  Popover,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Share as ShareIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  Crown as CrownIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useUnifiedParticipantsOptional } from '../../contexts/UnifiedParticipantContext';

export interface SharedConversationHeaderProps {
  hostUserName?: string;
  conversationName?: string;
  isHost?: boolean;
  showParticipantAvatars?: boolean;
  compact?: boolean;
}

export const SharedConversationHeader: React.FC<SharedConversationHeaderProps> = ({
  hostUserName,
  conversationName,
  isHost = false,
  showParticipantAvatars = true,
  compact = false
}) => {
  const participantContext = useUnifiedParticipantsOptional();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // If no context, don't show (unified system not enabled)
  if (!participantContext) {
    return null;
  }

  const {
    participants,
    getActiveParticipants,
    getHumanParticipants,
    getAIAgentParticipants
  } = participantContext;

  const activeParticipants = getActiveParticipants();
  const humanParticipants = getHumanParticipants();
  const aiAgentParticipants = getAIAgentParticipants();
  const hostParticipant = participants.find(p => p.permissions.isHost);

  // Handle participant info popover
  const handleInfoClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Get participant avatar
  const getParticipantAvatar = (participant: any) => {
    if (participant.type === 'human') {
      return (
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: participant.permissions.isHost ? '#fbbf24' : '#3b82f6',
            fontSize: '0.7rem'
          }}
        >
          {participant.permissions.isHost ? <CrownIcon sx={{ fontSize: 14 }} /> : <PersonIcon sx={{ fontSize: 14 }} />}
        </Avatar>
      );
    } else {
      return (
        <Avatar
          sx={{
            width: 24,
            height: 24,
            bgcolor: participant.agentConfig?.color || '#8b5cf6',
            fontSize: '0.7rem'
          }}
        >
          <SmartToyIcon sx={{ fontSize: 14 }} />
        </Avatar>
      );
    }
  };

  // Compact version
  if (compact) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          bgcolor: '#374151',
          borderRadius: 1,
          border: '1px solid #4b5563'
        }}
      >
        <ShareIcon sx={{ color: '#3b82f6', fontSize: 16 }} />
        <Typography
          variant="caption"
          sx={{
            color: '#3b82f6',
            fontWeight: 500
          }}
        >
          Shared
        </Typography>
        <Chip
          label={`${activeParticipants.length}`}
          size="small"
          sx={{
            bgcolor: '#3b82f620',
            color: '#3b82f6',
            fontSize: '0.6rem',
            height: 18
          }}
        />
      </Box>
    );
  }

  // Full version
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        py: 2,
        bgcolor: '#1e293b',
        borderBottom: '1px solid #334155'
      }}
    >
      {/* Left Section - Collaboration Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Share Icon and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShareIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
          <Typography
            variant="h6"
            sx={{
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            {isHost ? 'Hosting Shared Chat' : `Shared with ${hostUserName || 'Host User'}`}
          </Typography>
        </Box>

        {/* Conversation Name */}
        {conversationName && (
          <Chip
            label={conversationName}
            size="small"
            sx={{
              bgcolor: '#374151',
              color: '#e2e8f0',
              fontSize: '0.7rem'
            }}
          />
        )}

        {/* Shared Chat Indicator */}
        <Chip
          label="Shared Chat"
          size="small"
          sx={{
            bgcolor: '#3b82f620',
            color: '#3b82f6',
            border: '1px solid #3b82f640',
            fontSize: '0.7rem'
          }}
        />
      </Box>

      {/* Right Section - Participants */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Participant Avatars */}
        {showParticipantAvatars && activeParticipants.length > 0 && (
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': {
                width: 28,
                height: 28,
                fontSize: '0.7rem',
                border: '2px solid #1e293b'
              }
            }}
          >
            {activeParticipants.map((participant) => (
              <Tooltip
                key={participant.id}
                title={`${participant.name} (${participant.type === 'human' ? 'Human' : 'AI Agent'})`}
              >
                {getParticipantAvatar(participant)}
              </Tooltip>
            ))}
          </AvatarGroup>
        )}

        {/* Participant Count */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            bgcolor: '#374151',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: '#4b5563'
            }
          }}
          onClick={handleInfoClick}
        >
          <PeopleIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
          <Typography
            variant="caption"
            sx={{
              color: '#e2e8f0',
              fontWeight: 500,
              fontSize: '0.8rem'
            }}
          >
            {activeParticipants.length} active
          </Typography>
        </Box>

        {/* Info Button */}
        <Tooltip title="View participant details">
          <IconButton
            size="small"
            onClick={handleInfoClick}
            sx={{
              color: '#94a3b8',
              '&:hover': {
                color: '#e2e8f0',
                bgcolor: '#374151'
              }
            }}
          >
            <InfoIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Participant Details Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleInfoClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1e293b',
            color: 'white',
            border: '1px solid #334155',
            minWidth: 280,
            maxWidth: 400
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Conversation Participants
          </Typography>

          <List sx={{ py: 0 }}>
            {/* Host */}
            {hostParticipant && (
              <>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#fbbf24', width: 32, height: 32 }}>
                      <CrownIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={hostParticipant.name}
                    secondary="Host"
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.7rem',
                      color: '#fbbf24'
                    }}
                  />
                </ListItem>
                {(humanParticipants.length > 1 || aiAgentParticipants.length > 0) && (
                  <Divider sx={{ borderColor: '#334155', my: 1 }} />
                )}
              </>
            )}

            {/* Other Human Participants */}
            {humanParticipants.filter(p => !p.permissions.isHost).map((participant) => (
              <ListItem key={participant.id} sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#3b82f6', width: 32, height: 32 }}>
                    <PersonIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.name}
                  secondary="Guest"
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.7rem',
                    color: '#3b82f6'
                  }}
                />
              </ListItem>
            ))}

            {/* AI Agents */}
            {aiAgentParticipants.length > 0 && humanParticipants.length > 0 && (
              <Divider sx={{ borderColor: '#334155', my: 1 }} />
            )}
            {aiAgentParticipants.map((participant) => (
              <ListItem key={participant.id} sx={{ px: 0, py: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: participant.agentConfig?.color || '#8b5cf6',
                      width: 32,
                      height: 32
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.name}
                  secondary={`AI Agent • Added by ${participants.find(p => p.id === participant.addedBy)?.name || 'Unknown'}`}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.7rem',
                    color: '#8b5cf6'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Popover>
    </Box>
  );
};

export default SharedConversationHeader;

