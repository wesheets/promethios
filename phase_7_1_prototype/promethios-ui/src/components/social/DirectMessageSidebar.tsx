import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Badge,
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
} from '@mui/material';
import {
  Close,
  Send,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  Add,
  Remove,
  Minimize,
  Maximize,
  Search,
} from '@mui/icons-material';
import { MessageService, ChatMessage, ChatConversation } from '../../services/MessageService';
import { ConnectionService } from '../../services/ConnectionService';
import { useAuth } from '../../context/AuthContext';

interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  isOnline: boolean;
  lastMessage?: DirectMessage;
  unreadCount: number;
  messages: DirectMessage[];
  isTyping: boolean;
}

interface DirectMessageSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialConversationId?: string;
  currentUserId?: string;
  onStartVideoCall?: (participantId: string) => void;
  onStartVoiceCall?: (participantId: string) => void;
  connections?: any[];
}

const DirectMessageSidebar: React.FC<DirectMessageSidebarProps> = ({
  isOpen,
  onClose,
  initialConversationId,
  currentUserId: propCurrentUserId = 'current-user',
  onStartVideoCall,
  onStartVoiceCall,
  connections = [],
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(true); // Start minimized by default
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // Search functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentUser } = useAuth();
  
  const messageService = MessageService.getInstance();
  const currentUserId = messageService.getCurrentUserId() || propCurrentUserId;
  const currentUserName = messageService.getCurrentUserName();
  const currentUserAvatar = messageService.getCurrentUserAvatar();

  // Convert connections to conversations
  const createConversationsFromConnections = (connections: any[]): Conversation[] => {
    return connections.map((connection, index) => ({
      id: connection.id || `conv-${index}`,
      participantId: connection.userId || connection.id,
      participantName: connection.displayName || connection.name || 'Unknown User',
      participantAvatar: connection.photoURL || connection.avatar,
      isOnline: Math.random() > 0.5, // Random online status for now
      unreadCount: 0, // Start with no unread messages
      isTyping: false,
      lastMessage: undefined, // No messages initially
      messages: [], // Empty messages array
    }));
  };

  useEffect(() => {
    if (connections.length > 0) {
      const realConversations = createConversationsFromConnections(connections);
      setConversations(realConversations);
      
      if (initialConversationId) {
        setActiveConversationId(initialConversationId);
      } else if (realConversations.length > 0) {
        setActiveConversationId(realConversations[0].id);
      }
    } else {
      // Fallback to empty conversations if no connections
      setConversations([]);
      setActiveConversationId(null);
    }
  }, [connections, initialConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId, messages]);

  // Subscribe to real conversations from Firebase
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = messageService.subscribeToConversations(
      currentUserId,
      (firebaseConversations) => {
        // Convert Firebase conversations to local conversation format
        const convertedConversations: Conversation[] = firebaseConversations.map(conv => {
          const otherParticipantId = conv.participants.find(p => p !== currentUserId) || '';
          const otherParticipantName = conv.participantNames[otherParticipantId] || 'Unknown User';
          const otherParticipantAvatar = conv.participantAvatars[otherParticipantId];
          
          return {
            id: conv.id,
            participantId: otherParticipantId,
            participantName: otherParticipantName,
            participantAvatar: otherParticipantAvatar,
            isOnline: Math.random() > 0.5, // Random for now
            unreadCount: conv.unreadCounts[currentUserId] || 0,
            isTyping: false,
            lastMessage: conv.lastMessage ? {
              id: conv.lastMessage.id || 'temp',
              senderId: conv.lastMessage.senderId,
              senderName: conv.lastMessage.senderName,
              content: conv.lastMessage.content,
              timestamp: conv.lastMessage.timestamp instanceof Date 
                ? conv.lastMessage.timestamp.toLocaleString()
                : 'Recently',
              isRead: conv.lastMessage.isRead,
              type: conv.lastMessage.type
            } : undefined,
            messages: [] // Will be loaded separately
          };
        });
        
        setConversations(convertedConversations);
        
        // Set active conversation if none selected
        if (!activeConversationId && convertedConversations.length > 0) {
          setActiveConversationId(convertedConversations[0].id);
        }
      }
    );

    return unsubscribe;
  }, [currentUserId, activeConversationId]);

  // Subscribe to messages for active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const unsubscribe = messageService.subscribeToMessages(
      activeConversationId,
      (firebaseMessages) => {
        setMessages(firebaseMessages);
        
        // Mark messages as read when viewing conversation
        if (currentUserId) {
          messageService.markMessagesAsRead(activeConversationId, currentUserId);
        }
      }
    );

    return unsubscribe;
  }, [activeConversationId, currentUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load user connections for New Chat modal
  useEffect(() => {
    const loadUserConnections = async () => {
      if (!currentUser) return;
      
      try {
        const connectionService = ConnectionService.getInstance();
        const connections = await connectionService.getUserConnections(currentUser.uid);
        setUserConnections(connections);
      } catch (error) {
        console.error('❌ Failed to load user connections:', error);
      }
    };

    if (newChatModalOpen) {
      loadUserConnections();
    }
  }, [newChatModalOpen, currentUser]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeConversationId || !currentUserId) return;

    setIsLoading(true);
    try {
      await messageService.sendMessage(
        activeConversationId,
        currentUserId,
        currentUserName,
        messageInput.trim(),
        currentUserAvatar
      );
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could add error notification here
    } finally {
      setIsLoading(false);
    }
  };

  // Handle starting a conversation with a connection - opens floating chat window
  const handleStartConversation = async (connection: any) => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const conversationId = await messageService.getOrCreateConversation(
        currentUserId,
        connection.userId || connection.id,
        currentUserName,
        connection.displayName || connection.name || connection.userName || 'Unknown User',
        currentUserAvatar,
        connection.photoURL || connection.avatar
      );
      
      // Open floating chat window instead of setting active conversation in sidebar
      const openFloatingChat = (window as any).openFloatingChat;
      if (openFloatingChat) {
        openFloatingChat({
          participantId: connection.userId || connection.id,
          participantName: connection.displayName || connection.name || connection.userName || 'Unknown User',
          participantAvatar: connection.photoURL || connection.avatar,
          conversationId: conversationId
        });
        console.log('✅ [DirectMessages] Opened floating chat for:', connection.displayName || connection.name);
      } else {
        console.warn('⚠️ [DirectMessages] openFloatingChat not available, falling back to sidebar');
        setActiveConversationId(conversationId);
      }
    } catch (error) {
      console.error('❌ [DirectMessages] Failed to start conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const renderMessage = (message: ChatMessage) => {
    const isOwnMessage = message.senderId === currentUserId;
    
    // Format timestamp
    let formattedTime = 'Recently';
    if (message.timestamp) {
      if (message.timestamp instanceof Date) {
        formattedTime = message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (message.timestamp.toDate) {
        formattedTime = message.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Paper
          sx={{
            p: 1.5,
            maxWidth: '70%',
            backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            borderBottomRightRadius: isOwnMessage ? 0.5 : 2,
            borderBottomLeftRadius: isOwnMessage ? 2 : 0.5,
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.5,
              opacity: 0.7,
              fontSize: '0.7rem',
            }}
          >
            {formattedTime}
          </Typography>
        </Paper>
      </Box>
    );
  };

  const renderConversationTab = (conversation: Conversation) => (
    <Box
      key={conversation.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1,
        cursor: 'pointer',
        backgroundColor: activeConversationId === conversation.id ? 'action.selected' : 'transparent',
        '&:hover': { backgroundColor: 'action.hover' },
        borderRadius: 1,
        mb: 0.5,
      }}
      onClick={() => setActiveConversationId(conversation.id)}
    >
      <Badge
        badgeContent={conversation.unreadCount}
        color="primary"
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Avatar
          src={conversation.participantAvatar}
          sx={{ width: 32, height: 32 }}
        >
          {conversation.participantName.charAt(0)}
        </Avatar>
      </Badge>
      
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem' }}>
            {conversation.participantName}
          </Typography>
          <Circle
            sx={{
              fontSize: 8,
              color: conversation.isOnline ? 'success.main' : 'grey.400',
            }}
          />
        </Box>
        
        {conversation.isTyping ? (
          <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
            typing...
          </Typography>
        ) : conversation.lastMessage ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.75rem',
            }}
          >
            {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
            {conversation.lastMessage.content}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  return (
    <Drawer
      anchor="left"
      open={isOpen}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: isMinimized ? 300 : 400,
          height: isMinimized ? 60 : '100vh',
          transition: 'all 0.3s ease',
          zIndex: 1300,
          left: 240, // Position right after the left sidebar (assuming 240px width)
          top: 0, // Flush with top of screen, right next to Messages tab
          position: 'fixed',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Direct Messages
          </Typography>
          {totalUnreadCount > 0 && (
            <Badge badgeContent={totalUnreadCount} color="primary" />
          )}
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="New Chat">
              <IconButton
                size="small"
                onClick={() => setNewChatModalOpen(true)}
                sx={{ 
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.main', color: 'white' }
                }}
              >
                <Add />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize /> : <Minimize />}
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </Box>

      {!isMinimized && (
        <>
          {/* Conversation List */}
          <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', maxHeight: 200, overflow: 'auto' }}>
            {conversations.map(renderConversationTab)}
          </Box>

          {/* Active Conversation */}
          {activeConversation && (
            <>
              {/* Conversation Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={activeConversation.participantAvatar}
                    sx={{ width: 32, height: 32 }}
                  >
                    {activeConversation.participantName.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {activeConversation.participantName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Circle
                        sx={{
                          fontSize: 6,
                          color: activeConversation.isOnline ? 'success.main' : 'grey.400',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {activeConversation.isOnline ? 'Online' : 'Offline'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Voice Call">
                    <IconButton
                      size="small"
                      onClick={() => onStartVoiceCall?.(activeConversation.participantId)}
                    >
                      <Call />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Video Call">
                    <IconButton
                      size="small"
                      onClick={() => onStartVideoCall?.(activeConversation.participantId)}
                    >
                      <VideoCall />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              </Box>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  overflow: 'auto',
                  backgroundColor: 'grey.50',
                }}
              >
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                ) : (
                  messages.map(renderMessage)
                )}
                {activeConversation?.isTyping && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                    <Paper
                      sx={{
                        p: 1.5,
                        backgroundColor: 'grey.100',
                        borderRadius: 2,
                        borderBottomLeftRadius: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {activeConversation.participantName} is typing...
                      </Typography>
                    </Paper>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder={`Message ${activeConversation.participantName}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      },
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small">
                      <AttachFile />
                    </IconButton>
                    <IconButton size="small">
                      <EmojiEmotions />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim()}
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </>
          )}
        </>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <Info sx={{ mr: 1 }} />
          View Profile
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          Mute Conversation
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          Clear History
        </MenuItem>
      </Menu>

      {/* New Chat Modal */}
      <Dialog
        open={newChatModalOpen}
        onClose={() => setNewChatModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Start New Chat</Typography>
            <IconButton onClick={() => setNewChatModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a connection to start chatting with:
          </Typography>
          
          {/* Search Bar */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          
          {userConnections.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No connections available. Connect with other users first!
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {userConnections
                .filter((connection) => {
                  const isUser1 = connection.userId1 === currentUserId;
                  const otherUserName = isUser1 ? connection.user2Name : connection.user1Name;
                  return otherUserName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
                })
                .map((connection) => {
                // Determine which user is the "other" user (not current user)
                const isUser1 = connection.userId1 === currentUserId;
                const otherUserId = isUser1 ? connection.userId2 : connection.userId1;
                const otherUserName = isUser1 ? connection.user2Name : connection.user1Name;
                const otherUserAvatar = isUser1 ? connection.user2Avatar : connection.user1Avatar;
                
                console.log('🔍 [New Chat] Connection data:', connection);
                console.log('🔍 [New Chat] Other user:', { otherUserId, otherUserName, otherUserAvatar });
                
                return (
                  <Grid item xs={12} key={otherUserId}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={() => {
                        handleStartConversation({
                          userId: otherUserId,
                          userName: otherUserName,
                          avatar: otherUserAvatar
                        });
                        setNewChatModalOpen(false);
                      }}
                    >
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                        <Avatar 
                          src={otherUserAvatar}
                          sx={{ width: 40, height: 40 }}
                        >
                          {otherUserName?.[0] || '?'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {otherUserName || 'Unknown User'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Connected User
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Drawer>
  );
};

export default DirectMessageSidebar;

