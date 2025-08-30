import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import {
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useChatIntegration } from './ChatIntegrationProvider';
import { ConnectionService } from '../../services/ConnectionService';

interface ChatButtonProps {
  collapsed: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ collapsed }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { openDirectMessage } = useChatIntegration();

  // Calculate total unread messages from floating chat system
  useEffect(() => {
    // This will be handled by the ChatWindowManager
    // For now, we'll use a placeholder unread count
    setUnreadCount(0);
  }, []);

  const handleChatToggle = () => {
    // Instead of opening a sidebar, we'll show a message or navigate to messages page
    // For now, let's navigate to the messages page
    window.location.href = '/ui/social/messages';
  };

  if (collapsed) {
    // Collapsed state - icon only
    return (
      <Tooltip title="Messages" placement="right" arrow>
        <IconButton
          onClick={handleChatToggle}
          sx={{
            color: 'text.primary',
            width: '100%',
            mb: 0.5,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Badge badgeContent={unreadCount} color="primary" max={99}>
            <ChatIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    );
  }

  // Expanded state - icon with text
  return (
    <Tooltip title="Messages" arrow>
      <Box
        onClick={handleChatToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 1,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          transition: 'background-color 0.2s ease',
        }}
      >
        <Badge badgeContent={unreadCount} color="primary" max={99}>
          <ChatIcon sx={{ color: 'text.primary' }} />
        </Badge>
        <Typography
          variant="body2"
          sx={{
            color: 'text.primary',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Messages
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default ChatButton;

