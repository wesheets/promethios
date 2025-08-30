import React from 'react';
import {
  Box,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Typography,
  Paper,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface MinimizedChatBubbleProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  unreadCount?: number;
  position: { bottom: number; right: number };
  onClick: () => void;
  onClose: () => void;
  zIndex?: number;
}

const MinimizedChatBubble: React.FC<MinimizedChatBubbleProps> = ({
  conversationId,
  participantId,
  participantName,
  participantAvatar,
  unreadCount = 0,
  position,
  onClick,
  onClose,
  zIndex = 999,
}) => {
  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: position.bottom,
        right: position.right,
        zIndex,
        borderRadius: 3,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[12],
        },
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1,
          gap: 1,
          minWidth: 200,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: 16,
              height: 16,
            }
          }}
        >
          <Avatar
            src={participantAvatar}
            sx={{ width: 36, height: 36 }}
          >
            {participantName?.[0] || '?'}
          </Avatar>
        </Badge>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {participantName}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              opacity: 0.8,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {unreadCount > 0 ? `${unreadCount} new message${unreadCount > 1 ? 's' : ''}` : 'Click to open'}
          </Typography>
        </Box>

        <Tooltip title="Close Chat">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            sx={{ 
              color: 'inherit',
              opacity: 0.7,
              '&:hover': { opacity: 1 }
            }}
          >
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default MinimizedChatBubble;

