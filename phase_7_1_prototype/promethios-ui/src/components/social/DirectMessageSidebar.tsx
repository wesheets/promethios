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
} from '@mui/material';
import {
  Close,
  Send,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  VideoCall,
  Call,
  Info,
  Minimize,
  Maximize,
  Circle,
} from '@mui/icons-material';

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
}

const DirectMessageSidebar: React.FC<DirectMessageSidebarProps> = ({
  isOpen,
  onClose,
  initialConversationId,
  currentUserId = 'current-user',
  onStartVideoCall,
  onStartVoiceCall,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participantId: 'sarah-chen',
      participantName: 'Sarah Chen',
      participantAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      isOnline: true,
      unreadCount: 2,
      isTyping: false,
      lastMessage: {
        id: '1',
        senderId: 'sarah-chen',
        senderName: 'Sarah Chen',
        content: 'Did you see Claude\'s analysis on the marketing strategy?',
        timestamp: '2 minutes ago',
        isRead: false,
        type: 'text',
      },
      messages: [
        {
          id: '1',
          senderId: 'sarah-chen',
          senderName: 'Sarah Chen',
          content: 'Hey! How\'s the AI collaboration going?',
          timestamp: '10 minutes ago',
          isRead: true,
          type: 'text',
        },
        {
          id: '2',
          senderId: currentUserId,
          senderName: 'You',
          content: 'Great! Claude just provided some amazing insights.',
          timestamp: '8 minutes ago',
          isRead: true,
          type: 'text',
        },
        {
          id: '3',
          senderId: 'sarah-chen',
          senderName: 'Sarah Chen',
          content: 'Did you see Claude\'s analysis on the marketing strategy?',
          timestamp: '2 minutes ago',
          isRead: false,
          type: 'text',
        },
      ],
    },
    {
      id: '2',
      participantId: 'marcus-rodriguez',
      participantName: 'Marcus Rodriguez',
      participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      isOnline: false,
      unreadCount: 0,
      isTyping: false,
      lastMessage: {
        id: '1',
        senderId: currentUserId,
        senderName: 'You',
        content: 'Thanks for the GPT-4 collaboration tips!',
        timestamp: '1 hour ago',
        isRead: true,
        type: 'text',
      },
      messages: [
        {
          id: '1',
          senderId: 'marcus-rodriguez',
          senderName: 'Marcus Rodriguez',
          content: 'Want to collaborate on the AI research project?',
          timestamp: '2 hours ago',
          isRead: true,
          type: 'text',
        },
        {
          id: '2',
          senderId: currentUserId,
          senderName: 'You',
          content: 'Absolutely! I\'ve been working with GPT-4 on similar analysis.',
          timestamp: '1.5 hours ago',
          isRead: true,
          type: 'text',
        },
        {
          id: '3',
          senderId: currentUserId,
          senderName: 'You',
          content: 'Thanks for the GPT-4 collaboration tips!',
          timestamp: '1 hour ago',
          isRead: true,
          type: 'text',
        },
      ],
    },
    {
      id: '3',
      participantId: 'emily-watson',
      participantName: 'Emily Watson',
      participantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      isOnline: true,
      unreadCount: 1,
      isTyping: true,
      lastMessage: {
        id: '1',
        senderId: 'emily-watson',
        senderName: 'Emily Watson',
        content: 'The Claude + Gemini combination is working perfectly!',
        timestamp: '5 minutes ago',
        isRead: false,
        type: 'text',
      },
      messages: [
        {
          id: '1',
          senderId: 'emily-watson',
          senderName: 'Emily Watson',
          content: 'The Claude + Gemini combination is working perfectly!',
          timestamp: '5 minutes ago',
          isRead: false,
          type: 'text',
        },
      ],
    },
  ];

  useEffect(() => {
    setConversations(mockConversations);
    if (initialConversationId) {
      setActiveConversationId(initialConversationId);
    } else if (mockConversations.length > 0) {
      setActiveConversationId(mockConversations[0].id);
    }
  }, [initialConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeConversationId) return;

    const newMessage: DirectMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      senderName: 'You',
      content: messageInput.trim(),
      timestamp: 'Just now',
      isRead: true,
      type: 'text',
    };

    setConversations(prev => prev.map(conv => 
      conv.id === activeConversationId
        ? {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: newMessage,
          }
        : conv
    ));

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const totalUnreadCount = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const renderMessage = (message: DirectMessage) => {
    const isOwnMessage = message.senderId === currentUserId;
    
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
            {message.timestamp}
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
      anchor="right"
      open={isOpen}
      onClose={onClose}
      variant="persistent"
      sx={{
        '& .MuiDrawer-paper': {
          width: isMinimized ? 300 : 400,
          height: isMinimized ? 60 : '100vh',
          transition: 'all 0.3s ease',
          zIndex: 1300,
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
                {activeConversation.messages.map(renderMessage)}
                {activeConversation.isTyping && (
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
    </Drawer>
  );
};

export default DirectMessageSidebar;

