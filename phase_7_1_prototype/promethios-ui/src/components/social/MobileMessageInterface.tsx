import React, { useState, useEffect } from 'react';
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Fab,
  Slide,
  Divider,
  TextField,
  InputAdornment,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { ConnectionService } from '../../services/ConnectionService';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MobileMessageInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (userId: string, userName: string) => void;
}

interface Connection {
  id: string;
  name: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away';
}

interface ChatHistory {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  avatar?: string;
}

const MobileMessageInterface: React.FC<MobileMessageInterfaceProps> = ({
  isOpen,
  onClose,
  onOpenChat,
}) => {
  const [view, setView] = useState<'chats' | 'newChat'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (view === 'newChat') {
      loadConnections();
    }
  }, [view]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const connectionService = ConnectionService.getInstance();
      const userConnections = await connectionService.getUserConnections();
      
      const formattedConnections: Connection[] = userConnections.map(conn => ({
        id: conn.id,
        name: conn.name || 'Unknown User',
        avatar: conn.avatar,
        status: conn.status || 'offline',
      }));
      
      setConnections(formattedConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    try {
      // Mock data for now
      const mockHistory: ChatHistory[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Alice Johnson',
          lastMessage: 'Hey, how are you doing?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          unreadCount: 2,
          avatar: undefined,
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Bob Smith',
          lastMessage: 'Thanks for the help earlier!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          unreadCount: 0,
          avatar: undefined,
        },
      ];
      
      setChatHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setChatHistory([]);
    }
  };

  const handleStartNewChat = () => {
    setView('newChat');
  };

  const handleBackToChats = () => {
    setView('chats');
    setSearchQuery('');
  };

  const handleSelectConnection = (connection: Connection) => {
    onOpenChat(connection.id, connection.name);
    onClose(); // Close the mobile interface
  };

  const handleOpenExistingChat = (chat: ChatHistory) => {
    onOpenChat(chat.userId, chat.userName);
    onClose(); // Close the mobile interface
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else {
      return `${days}d`;
    }
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChats = chatHistory.filter(chat =>
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog
      fullScreen
      open={isOpen}
      onClose={onClose}
      TransitionComponent={Transition}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background.default',
        },
      }}
    >
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={view === 'newChat' ? handleBackToChats : onClose}
            aria-label="back"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flex: 1, ml: 1 }}>
            {view === 'chats' ? 'Messages' : 'New Chat'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Search Bar */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
        <TextField
          fullWidth
          placeholder={view === 'chats' ? 'Search conversations...' : 'Search contacts...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {view === 'chats' ? (
          // Chat History View
          <>
            {filteredChats.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <ChatIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No conversations yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a new chat to begin messaging
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredChats.map((chat, index) => (
                  <React.Fragment key={chat.id}>
                    <ListItem
                      button
                      onClick={() => handleOpenExistingChat(chat)}
                      sx={{
                        py: 2,
                        px: 3,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={chat.unreadCount}
                          color="primary"
                          invisible={chat.unreadCount === 0}
                        >
                          <Avatar src={chat.avatar} sx={{ width: 48, height: 48 }}>
                            {chat.userName.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={chat.unreadCount > 0 ? 600 : 400}>
                            {chat.userName}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '200px',
                                fontWeight: chat.unreadCount > 0 ? 500 : 400,
                              }}
                            >
                              {chat.lastMessage}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimestamp(chat.timestamp)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < filteredChats.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        ) : (
          // New Chat View
          <>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading contacts...</Typography>
              </Box>
            ) : filteredConnections.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No contacts found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with other users to start messaging
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {filteredConnections.map((connection, index) => (
                  <React.Fragment key={connection.id}>
                    <ListItem
                      button
                      onClick={() => handleSelectConnection(connection)}
                      sx={{
                        py: 2,
                        px: 3,
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          variant="dot"
                          color={connection.status === 'online' ? 'success' : 'default'}
                          invisible={connection.status !== 'online'}
                        >
                          <Avatar src={connection.avatar} sx={{ width: 48, height: 48 }}>
                            {connection.name.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1">
                            {connection.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            {connection.status || 'offline'}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < filteredConnections.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </>
        )}
      </Box>

      {/* Floating Action Button - Only show in chats view */}
      {view === 'chats' && (
        <Fab
          color="primary"
          aria-label="new chat"
          onClick={handleStartNewChat}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Dialog>
  );
};

export default MobileMessageInterface;

