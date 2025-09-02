import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Divider,
  Collapse,
  Badge
} from '@mui/material';
import {
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Maximize as MaximizeIcon,
  Send as SendIcon,
  ChatBubble as ChatIcon
} from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'participant';
  timestamp: Date;
}

interface FixedBottomChatProps {
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  onClose: () => void;
  position?: number; // For stacking multiple chats
}

const FixedBottomChat: React.FC<FixedBottomChatProps> = ({
  participantId,
  participantName,
  participantAvatar,
  onClose,
  position = 0
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate position based on stack order
  const rightOffset = 20 + (position * 340); // 320px width + 20px gap
  const bottomOffset = 20;

  console.log('🎯 [FixedBottomChat] Rendering chat for:', participantName, 'at position:', position);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: `msg-${Date.now()}`,
        text: newMessage.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      console.log('💬 [FixedBottomChat] Sent message:', message.text);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0); // Clear unread when expanding
    }
  };

  // Simulate receiving messages (for demo)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          text: `Hi! I'm ${participantName}. How can I help you?`,
          sender: 'participant',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        
        if (isMinimized) {
          setUnreadCount(prev => prev + 1);
        }
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [participantName, messages.length, isMinimized]);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: bottomOffset,
        right: rightOffset,
        width: 320,
        maxHeight: isMinimized ? 60 : 480,
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 2,
        overflow: 'hidden',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 1.5,
          backgroundColor: '#0f172a',
          borderBottom: isMinimized ? 'none' : '1px solid #334155',
          cursor: 'pointer'
        }}
        onClick={toggleMinimize}
      >
        <Avatar
          src={participantAvatar}
          sx={{ width: 32, height: 32, mr: 1.5 }}
        >
          {participantName.charAt(0).toUpperCase()}
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            {participantName}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {isMinimized ? 'Click to expand' : 'Online'}
          </Typography>
        </Box>

        {isMinimized && unreadCount > 0 && (
          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }} />
        )}

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            toggleMinimize();
          }}
          sx={{ color: '#64748b', mr: 0.5 }}
        >
          {isMinimized ? <MaximizeIcon fontSize="small" /> : <MinimizeIcon fontSize="small" />}
        </IconButton>

        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{ color: '#64748b' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Chat Content */}
      <Collapse in={!isMinimized}>
        <Box sx={{ height: 360, display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              p: 1,
              overflowY: 'auto',
              backgroundColor: '#1e293b'
            }}
          >
            {messages.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#64748b'
                }}
              >
                <ChatIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" align="center">
                  Start a conversation with {participantName}
                </Typography>
              </Box>
            ) : (
              messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1
                  }}
                >
                  <Paper
                    sx={{
                      p: 1,
                      maxWidth: '80%',
                      backgroundColor: message.sender === 'user' ? '#3b82f6' : '#374151',
                      color: 'white',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2">{message.text}</Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: message.sender === 'user' ? '#bfdbfe' : '#9ca3af',
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </Paper>
                </Box>
              ))
            )}
          </Box>

          <Divider sx={{ borderColor: '#334155' }} />

          {/* Message Input */}
          <Box sx={{ p: 1, backgroundColor: '#0f172a' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={`Message ${participantName}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#1e293b',
                    color: 'white',
                    '& fieldset': {
                      borderColor: '#334155'
                    },
                    '&:hover fieldset': {
                      borderColor: '#475569'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#3b82f6'
                    }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#64748b'
                  }
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                sx={{
                  color: newMessage.trim() ? '#3b82f6' : '#64748b',
                  backgroundColor: '#1e293b',
                  '&:hover': {
                    backgroundColor: '#334155'
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default FixedBottomChat;

