import React, { useState } from 'react';
import {
  Avatar,
  Tooltip,
  IconButton,
  Box,
  Fade,
  Paper,
  Typography,
  Badge,
} from '@mui/material';
import {
  Message,
  Circle,
  VideoCall,
  Call,
} from '@mui/icons-material';

interface HoverChatTriggerProps {
  userId: string;
  userName: string;
  userAvatar?: string;
  isOnline?: boolean;
  unreadCount?: number;
  onOpenChat: (userId: string, userName: string) => void;
  onStartVideoCall?: (userId: string) => void;
  onStartVoiceCall?: (userId: string) => void;
  size?: 'small' | 'medium' | 'large';
  showQuickActions?: boolean;
}

const HoverChatTrigger: React.FC<HoverChatTriggerProps> = ({
  userId,
  userName,
  userAvatar,
  isOnline = false,
  unreadCount = 0,
  onOpenChat,
  onStartVideoCall,
  onStartVoiceCall,
  size = 'medium',
  showQuickActions = true,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const avatarSizes = {
    small: { width: 32, height: 32 },
    medium: { width: 40, height: 40 },
    large: { width: 48, height: 48 },
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenChat(userId, userName);
  };

  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartVideoCall?.(userId);
  };

  const handleVoiceCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartVoiceCall?.(userId);
  };

  return (
    <Box
      sx={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => {
        setIsHovered(true);
        if (showQuickActions) {
          setTimeout(() => setShowActions(true), 200);
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowActions(false);
      }}
    >
      {/* Main Avatar */}
      <Tooltip
        title={
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {userName}
            </Typography>
            <Typography variant="caption" color="inherit">
              {isOnline ? 'Online • Click for private chat' : 'Offline • Click to message'}
            </Typography>
          </Box>
        }
        placement="top"
        arrow
      >
        <Badge
          badgeContent={unreadCount}
          color="primary"
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Avatar
            src={userAvatar}
            sx={{
              ...avatarSizes[size],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isHovered ? 3 : 1,
              border: isHovered ? 2 : 1,
              borderColor: isHovered ? 'primary.main' : 'grey.300',
              position: 'relative',
            }}
            onClick={handleChatClick}
          >
            {userName.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </Tooltip>

      {/* Online Status Indicator */}
      <Circle
        sx={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          fontSize: size === 'small' ? 8 : size === 'medium' ? 10 : 12,
          color: isOnline ? 'success.main' : 'grey.400',
          backgroundColor: 'background.paper',
          borderRadius: '50%',
          zIndex: 1,
        }}
      />

      {/* Quick Actions Popup */}
      {showQuickActions && (
        <Fade in={showActions} timeout={200}>
          <Paper
            sx={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              mt: 1,
              p: 1,
              display: 'flex',
              gap: 0.5,
              zIndex: 1000,
              boxShadow: 3,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              border: 1,
              borderColor: 'grey.200',
            }}
          >
            <Tooltip title="Private Message" placement="bottom">
              <IconButton
                size="small"
                onClick={handleChatClick}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
              >
                <Message sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>

            {isOnline && onStartVoiceCall && (
              <Tooltip title="Voice Call" placement="bottom">
                <IconButton
                  size="small"
                  onClick={handleVoiceCall}
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'success.contrastText',
                    '&:hover': {
                      backgroundColor: 'success.dark',
                    },
                  }}
                >
                  <Call sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            {isOnline && onStartVideoCall && (
              <Tooltip title="Video Call" placement="bottom">
                <IconButton
                  size="small"
                  onClick={handleVideoCall}
                  sx={{
                    backgroundColor: 'info.main',
                    color: 'info.contrastText',
                    '&:hover': {
                      backgroundColor: 'info.dark',
                    },
                  }}
                >
                  <VideoCall sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}
          </Paper>
        </Fade>
      )}

      {/* Hover Glow Effect */}
      {isHovered && (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            left: -4,
            right: -4,
            bottom: -4,
            borderRadius: '50%',
            background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.3), rgba(25, 118, 210, 0.1))',
            animation: 'pulse 1.5s ease-in-out infinite',
            zIndex: -1,
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 0.7,
              },
              '50%': {
                transform: 'scale(1.1)',
                opacity: 0.4,
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 0.7,
              },
            },
          }}
        />
      )}
    </Box>
  );
};

export default HoverChatTrigger;

