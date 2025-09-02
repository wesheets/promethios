import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Tooltip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Close,
  Send,
  Minimize,
  DragIndicator,
  Circle
} from '@mui/icons-material';
import Draggable from 'react-draggable';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

interface LightweightFloatingChatProps {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  position?: { x: number; y: number };
  onClose: () => void;
  onMinimize: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
}

const LightweightFloatingChat: React.FC<LightweightFloatingChatProps> = ({
  conversationId,
  participantId,
  participantName,
  participantAvatar,
  position = { x: 300, y: 200 },
  onClose,
  onMinimize,
  onPositionChange,
}) => {
  const { currentUser: user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('🎯 [LightweightFloatingChat] Rendering with:', {
    conversationId,
    participantId,
    participantName,
    position
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        // TODO: Load messages from the same conversation system used by DirectMessageSidebar
        // For now, simulate loading
        setTimeout(() => {
          setMessages([
            {
              id: '1',
              senderId: participantId,
              content: `Hey! This is a lightweight chat with ${participantName}`,
              timestamp: new Date()
            }
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId, participantId, participantName]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    try {
      setIsSending(true);
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: user?.uid || 'anonymous',
        content: messageInput.trim(),
        timestamp: new Date()
      };

      // Add message optimistically
      setMessages(prev => [...prev, newMessage]);
      setMessageInput('');

      // TODO: Send message through the same system used by DirectMessageSidebar
      console.log('📤 [LightweightFloatingChat] Sending message:', newMessage);

    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize();
  };

  const handleRestore = () => {
    if (isMinimized) {
      setIsMinimized(false);
    }
  };

  console.log('🎯 [LightweightFloatingChat] RENDERING with props:', {
    participantId,
    participantName,
    position,
    isMinimized
  });

  return (
    <Draggable
      handle=".lightweight-chat-header"
      position={position}
      onStop={(e, data) => {
        onPositionChange?.({ x: data.x, y: data.y });
      }}
    >
      <Paper
        elevation={12}
        sx={{
          position: 'fixed',
          width: 320,
          height: isMinimized ? 'auto' : 400,
          zIndex: 9999, // Increased z-index to ensure visibility
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '2px solid #22d3ee', // Bright cyan border for debugging
          boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)', // Glowing effect for debugging
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Header */}
        <Box
          className="lightweight-chat-header"
          onClick={handleRestore}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            backgroundColor: '#0f172a',
            color: 'white',
            cursor: isMinimized ? 'pointer' : 'move',
            userSelect: 'none',
            borderBottom: '1px solid #334155',
          }}
        >
          <Avatar
            src={participantAvatar}
            sx={{ width: 28, height: 28, mr: 1 }}
          >
            {participantName?.[0] || '?'}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {participantName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Circle sx={{ fontSize: 8, color: '#10b981' }} />
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                Online
              </Typography>
            </Box>
          </Box>

          {/* Header Actions */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Minimize">
              <IconButton size="small" sx={{ color: 'white' }} onClick={handleMinimize}>
                <Minimize fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Close">
              <IconButton size="small" sx={{ color: 'white' }} onClick={onClose}>
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Messages Area - Hidden when minimized */}
        {!isMinimized && (
          <Box
            sx={{
              flex: 1,
              p: 1,
              overflowY: 'auto',
              backgroundColor: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={20} sx={{ color: '#3b82f6' }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: 1,
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                No messages yet
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                Start the conversation!
              </Typography>
            </Box>
          ) : (
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.senderId === user?.uid ? 'flex-end' : 'flex-start',
                  mb: 0.5,
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    p: 1,
                    borderRadius: 1.5,
                    backgroundColor: message.senderId === user?.uid ? '#3b82f6' : '#374151',
                    color: 'white',
                  }}
                >
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {message.content}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
        )}

        {/* Divider and Input Area - Hidden when minimized */}
        {!isMinimized && (
          <>
            <Divider sx={{ borderColor: '#334155' }} />

            {/* Input Area */}
            <Box
              sx={{
                p: 1,
                display: 'flex',
                gap: 1,
                alignItems: 'flex-end',
                backgroundColor: '#0f172a',
              }}
            >
          <TextField
            multiline
            maxRows={2}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            variant="outlined"
            size="small"
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
                backgroundColor: '#1e293b',
                color: 'white',
                fontSize: '0.875rem',
                '& fieldset': {
                  borderColor: '#334155',
                },
                '&:hover fieldset': {
                  borderColor: '#3b82f6',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#3b82f6',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                '&::placeholder': {
                  color: '#94a3b8',
                  opacity: 1,
                },
              },
            }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            sx={{
              backgroundColor: '#3b82f6',
              color: 'white',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: '#2563eb',
              },
              '&:disabled': {
                backgroundColor: '#374151',
                color: '#6b7280',
              },
            }}
          >
            {isSending ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Send fontSize="small" />}
          </IconButton>
        </Box>
          </>
        )}

        {/* Resize Handle */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 16,
            height: 16,
            cursor: 'nw-resize',
            backgroundColor: '#374151',
            opacity: 0.3,
            '&:hover': { opacity: 0.6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DragIndicator sx={{ fontSize: 10, color: 'white' }} />
        </Box>
      </Paper>
    </Draggable>
  );
};

export default LightweightFloatingChat;

