import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { clientChatService, ClientChatMessage, ClientChatSession } from '../services/clientChatService';
import { useAuth } from '../context/AuthContext';

// Dark theme colors
const DARK_THEME = {
  background: '#1a202c',
  surface: '#2d3748',
  border: '#4a5568',
  text: {
    primary: '#ffffff',
    secondary: '#a0aec0'
  },
  primary: '#3182ce',
  success: '#38a169',
  error: '#e53e3e'
};

const ChatContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '600px',
  backgroundColor: DARK_THEME.background,
  color: DARK_THEME.text.primary,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '8px',
  overflow: 'hidden'
}));

const ChatHeader = styled(Box)(() => ({
  padding: '16px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  padding: '16px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}));

const MessageBubble = styled(Paper)<{ isUser: boolean }>(({ isUser }) => ({
  padding: '12px 16px',
  maxWidth: '70%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? DARK_THEME.primary : DARK_THEME.surface,
  color: DARK_THEME.text.primary,
  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  wordBreak: 'break-word'
}));

const InputContainer = styled(Box)(() => ({
  padding: '16px',
  borderTop: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end'
}));

interface SimpleChatComponentProps {
  agentId: string;
  agentName: string;
  apiKey: string;
}

export const SimpleChatComponent: React.FC<SimpleChatComponentProps> = ({
  agentId,
  agentName,
  apiKey
}) => {
  const [session, setSession] = useState<ClientChatSession | null>(null);
  const [messages, setMessages] = useState<ClientChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Initialize chat session
  useEffect(() => {
    if (agentId && agentName && apiKey) {
      console.log('🎯 Initializing simple chat for agent:', agentName);
      const newSession = clientChatService.createSession(agentId, agentName, apiKey);
      setSession(newSession);
      setMessages(newSession.messages);
    }
  }, [agentId, agentName, apiKey]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      console.log('💬 Sending message to agent:', userMessage);
      
      // Send message through client-side service
      await clientChatService.sendMessage(session.sessionId, userMessage);
      
      // Update messages from session
      const updatedMessages = clientChatService.getConversationHistory(session.sessionId);
      setMessages([...updatedMessages]);
      
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!session) {
    return (
      <Card sx={{ backgroundColor: DARK_THEME.surface, color: DARK_THEME.text.primary }}>
        <CardContent>
          <Typography>Initializing chat session...</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <ChatContainer>
      <ChatHeader>
        <Avatar sx={{ backgroundColor: DARK_THEME.primary }}>
          <BotIcon />
        </Avatar>
        <Box>
          <Typography variant="h6">{agentName}</Typography>
          <Typography variant="body2" color={DARK_THEME.text.secondary}>
            Direct API Chat • Agent ID: {agentId.slice(0, 8)}...
          </Typography>
        </Box>
      </ChatHeader>

      <MessagesContainer>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color={DARK_THEME.text.secondary}>
              Start a conversation with {agentName}
            </Typography>
          </Box>
        )}

        {messages.map((message) => (
          <Box key={message.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                backgroundColor: message.role === 'user' ? DARK_THEME.primary : DARK_THEME.success 
              }}
            >
              {message.role === 'user' ? <PersonIcon fontSize="small" /> : <BotIcon fontSize="small" />}
            </Avatar>
            <MessageBubble isUser={message.role === 'user'}>
              <Typography variant="body1">{message.content}</Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1, 
                  opacity: 0.7,
                  fontSize: '0.75rem'
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </MessageBubble>
          </Box>
        ))}

        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, backgroundColor: DARK_THEME.success }}>
              <BotIcon fontSize="small" />
            </Avatar>
            <Paper sx={{ p: 2, backgroundColor: DARK_THEME.surface }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Thinking...</Typography>
              </Box>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </MessagesContainer>

      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 2, backgroundColor: DARK_THEME.error, color: 'white' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <InputContainer>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isLoading}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: DARK_THEME.background,
              color: DARK_THEME.text.primary,
              '& fieldset': {
                borderColor: DARK_THEME.border,
              },
              '&:hover fieldset': {
                borderColor: DARK_THEME.primary,
              },
              '&.Mui-focused fieldset': {
                borderColor: DARK_THEME.primary,
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: DARK_THEME.text.secondary,
              opacity: 1,
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          sx={{
            backgroundColor: DARK_THEME.primary,
            '&:hover': {
              backgroundColor: '#2c5aa0',
            },
            minWidth: '48px',
            height: '48px'
          }}
        >
          <SendIcon />
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default SimpleChatComponent;

