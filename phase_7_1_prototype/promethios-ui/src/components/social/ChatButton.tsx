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
import DirectMessageSidebar from './DirectMessageSidebar';
import { ConnectionService } from '../../services/ConnectionService';

interface ChatButtonProps {
  collapsed: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ collapsed }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connections, setConnections] = useState<any[]>([]);
  const { conversations } = useChatIntegration();

  // Load real connections from ConnectionService
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const connectionService = ConnectionService.getInstance();
        const userConnections = await connectionService.getUserConnections();
        setConnections(userConnections);
      } catch (error) {
        console.error('Failed to load connections for chat:', error);
        setConnections([]);
      }
    };

    loadConnections();
  }, []);

  // Calculate total unread messages from all conversations
  useEffect(() => {
    const totalUnread = (conversations || []).reduce((sum, conv) => sum + (conv?.unreadCount || 0), 0);
    setUnreadCount(totalUnread);
  }, [conversations]);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  if (collapsed) {
    // Collapsed state - icon only
    return (
      <>
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
        
        <DirectMessageSidebar
          isOpen={isChatOpen}
          onClose={handleChatClose}
          connections={connections}
        />
      </>
    );
  }

  // Expanded state - icon with text
  return (
    <>
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
      
      <DirectMessageSidebar
        isOpen={isChatOpen}
        onClose={handleChatClose}
        connections={connections}
      />
    </>
  );
};

export default ChatButton;

