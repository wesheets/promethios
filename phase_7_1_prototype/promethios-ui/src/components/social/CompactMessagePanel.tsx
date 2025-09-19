import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { ConnectionService } from '../../services/ConnectionService';
import { MessageService } from '../../services/MessageService';
import { useAuth } from '../../context/AuthContext';

interface CompactMessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFloatingChat: (userId: string, userName: string) => void;
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

const CompactMessagePanel: React.FC<CompactMessagePanelProps> = ({
  isOpen,
  onClose,
  onOpenFloatingChat,
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Load connections when dialog opens
  useEffect(() => {
    if (showNewChatDialog) {
      loadConnections();
    }
  }, [showNewChatDialog]);

  // Load chat history when panel expands
  useEffect(() => {
    if (isExpanded) {
      loadChatHistory();
    }
  }, [isExpanded]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        setConnections([]);
        setLoading(false);
        return;
      }
      
      const connectionService = ConnectionService.getInstance();
      const userConnections = await connectionService.getUserConnections(user.uid);
      
      // Transform connections to our format
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
      // This would load from MessageService or similar
      // For now, we'll use mock data
      const mockHistory: ChatHistory[] = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Alice Johnson',
          lastMessage: 'Hey, how are you doing?',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          unreadCount: 2,
          avatar: undefined,
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Bob Smith',
          lastMessage: 'Thanks for the help earlier!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
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
    setShowNewChatDialog(true);
  };

  const handleSelectConnection = (connection: Connection) => {
    setShowNewChatDialog(false);
    onOpenFloatingChat(connection.id, connection.name);
  };

  const handleOpenExistingChat = (chat: ChatHistory) => {
    onOpenFloatingChat(chat.userId, chat.userName);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Compact Message Panel */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          top: 60,
          right: 20,
          width: 320,
          maxHeight: isExpanded ? '70vh' : 'auto',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 1300,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ChatIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Direct Messages
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Start New Chat">
              <IconButton
                size="small"
                onClick={handleStartNewChat}
                sx={{ color: 'primary.contrastText' }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title={isExpanded ? "Collapse" : "Show Chat History"}>
              <IconButton
                size="small"
                onClick={handleToggleExpand}
                sx={{ color: 'primary.contrastText' }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Close">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ color: 'primary.contrastText' }}
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Expandable Chat History */}
        <Collapse in={isExpanded}>
          <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
            {chatHistory.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No recent conversations
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start a new chat to begin messaging
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {chatHistory.map((chat) => (
                  <ListItem
                    key={chat.id}
                    button
                    onClick={() => handleOpenExistingChat(chat)}
                    sx={{
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
                        <Avatar src={chat.avatar}>
                          {chat.userName.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={chat.userName}
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px',
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
                ))}
              </List>
            )}
          </Box>
        </Collapse>
      </Paper>

      {/* Start New Chat Dialog */}
      <Dialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Start New Chat
          <Typography variant="body2" color="text.secondary">
            Select a connection to start chatting with:
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography>Loading connections...</Typography>
            </Box>
          ) : connections.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No connections found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Connect with other users to start messaging
              </Typography>
            </Box>
          ) : (
            <List>
              {connections.map((connection) => (
                <ListItem
                  key={connection.id}
                  button
                  onClick={() => handleSelectConnection(connection)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
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
                      <Avatar src={connection.avatar}>
                        {connection.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={connection.name}
                    secondary={`${connection.status || 'offline'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewChatDialog(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CompactMessagePanel;

