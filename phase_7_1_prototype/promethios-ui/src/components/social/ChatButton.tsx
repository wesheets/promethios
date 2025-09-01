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
import SimpleContactList from './SimpleContactList';
import { ConnectionService } from '../../services/ConnectionService';
import { useChatIntegration } from './ChatIntegrationProvider';

interface ChatButtonProps {
  collapsed: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ collapsed }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const { openDirectMessage } = useChatIntegration();

  // Load connections when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      loadConnections();
    }
  }, [isPanelOpen]);

  const loadConnections = async () => {
    try {
      const connectionService = ConnectionService.getInstance();
      const userConnections = await connectionService.getUserConnections();
      setConnections(userConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
      setConnections([]);
    }
  };

  // Calculate total unread messages from floating chat system
  useEffect(() => {
    // This will be handled by the ChatWindowManager
    // For now, we'll use a placeholder unread count
    setUnreadCount(0);
  }, []);

  const handleChatToggle = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  const handleOpenFloatingChat = (userId: string, userName: string) => {
    // Use the ChatIntegrationProvider to open floating chat
    openDirectMessage(userId, userName);
    // Close the contact list panel
    setIsPanelOpen(false);
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
        
        <SimpleContactList
          isOpen={isPanelOpen}
          onClose={handleClosePanel}
          onOpenFloatingChat={handleOpenFloatingChat}
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
      
      <SimpleContactList
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onOpenFloatingChat={handleOpenFloatingChat}
        connections={connections}
      />
    </>
  );
};

export default ChatButton;

