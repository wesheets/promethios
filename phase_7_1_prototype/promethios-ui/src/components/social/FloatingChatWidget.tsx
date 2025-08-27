import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Badge,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  Collapse,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Circle as OnlineIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { useChatIntegration } from './ChatIntegrationProvider';

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface FloatingChatWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  offset?: { bottom: number; right: number; left: number };
}

const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  position = 'bottom-right',
  offset = { bottom: 24, right: 24, left: 24 },
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  const { openDirectMessage, conversations } = useChatIntegration();

  // Mock contacts data
  const mockContacts: Contact[] = [
    {
      id: 'sarah-chen',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      isOnline: true,
      unreadCount: 2,
      lastMessage: 'What do you think about Claude\'s suggestion?',
      lastMessageTime: '2m ago',
    },
    {
      id: 'marcus-rodriguez',
      name: 'Marcus Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isOnline: true,
      unreadCount: 0,
      lastMessage: 'Great work on the AI strategy!',
      lastMessageTime: '1h ago',
    },
    {
      id: 'emily-watson',
      name: 'Emily Watson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      isOnline: false,
      lastSeen: '30m ago',
      unreadCount: 1,
      lastMessage: 'Can we schedule a call tomorrow?',
      lastMessageTime: '45m ago',
    },
    {
      id: 'david-kim',
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      isOnline: true,
      unreadCount: 0,
      lastMessage: 'Thanks for the collaboration!',
      lastMessageTime: '2h ago',
    },
    {
      id: 'lisa-zhang',
      name: 'Lisa Zhang',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      isOnline: false,
      lastSeen: '1h ago',
      unreadCount: 3,
      lastMessage: 'The AI analysis looks promising',
      lastMessageTime: '3h ago',
    },
  ];

  useEffect(() => {
    setContacts(mockContacts);
    const unreadTotal = mockContacts.reduce((sum, contact) => sum + contact.unreadCount, 0);
    setTotalUnreadCount(unreadTotal);
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactClick = (contact: Contact) => {
    openDirectMessage(contact.id, contact.name, contact.avatar);
    setIsOpen(false);
  };

  const handleToggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const positionStyles = {
    position: 'fixed' as const,
    zIndex: 1300,
    ...(position === 'bottom-right' 
      ? { bottom: offset.bottom, right: offset.right }
      : { bottom: offset.bottom, left: offset.left }
    ),
  };

  return (
    <Box sx={positionStyles}>
      {/* Contacts List Popup */}
      <Collapse in={isOpen} timeout={300}>
        <Paper
          elevation={8}
          sx={{
            width: 320,
            maxHeight: 480,
            mb: 2,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0,0,0,0.4)' 
              : '0 8px 32px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Messages
            </Typography>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: 'primary.contrastText' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Search */}
          <Box sx={{ p: 2, pb: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'background.default',
                  '& fieldset': {
                    borderColor: 'divider',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                },
              }}
            />
          </Box>

          {/* Contacts List */}
          <List sx={{ maxHeight: 320, overflow: 'auto', p: 0 }}>
            {filteredContacts.map((contact, index) => (
              <React.Fragment key={contact.id}>
                <ListItem
                  button
                  onClick={() => handleContactClick(contact)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={
                        contact.isOnline ? (
                          <OnlineIcon
                            sx={{
                              width: 12,
                              height: 12,
                              color: '#4CAF50',
                              backgroundColor: 'background.paper',
                              borderRadius: '50%',
                            }}
                          />
                        ) : null
                      }
                    >
                      <Avatar src={contact.avatar} sx={{ width: 40, height: 40 }}>
                        {contact.name.charAt(0)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: contact.unreadCount > 0 ? 600 : 400,
                            flex: 1,
                          }}
                        >
                          {contact.name}
                        </Typography>
                        {contact.unreadCount > 0 && (
                          <Badge
                            badgeContent={contact.unreadCount}
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                fontSize: '0.75rem',
                                minWidth: 18,
                                height: 18,
                              },
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: contact.unreadCount > 0 ? 500 : 400,
                          }}
                        >
                          {contact.lastMessage}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {contact.isOnline ? 'Online' : contact.lastSeen} • {contact.lastMessageTime}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                {index < filteredContacts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {/* Empty State */}
          {filteredContacts.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'No contacts found' : 'No recent conversations'}
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Floating Action Button */}
      <Tooltip title={isOpen ? 'Close messages' : 'Open messages'} placement="left">
        <Fab
          color="primary"
          onClick={handleToggleWidget}
          sx={{
            width: 56,
            height: 56,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Badge badgeContent={totalUnreadCount} color="error" max={99}>
            {isOpen ? <CloseIcon /> : <ChatIcon />}
          </Badge>
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default FloatingChatWidget;

