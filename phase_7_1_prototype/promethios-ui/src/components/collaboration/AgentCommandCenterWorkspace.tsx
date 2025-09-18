/**
 * AgentCommandCenterWorkspace - Individual agent command center within collaboration workspace
 * Shows the same interface as clicking "COMMAND CENTER" on chatbot page
 * Adapts between 100% and 50% width for side-by-side collaboration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Send,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface AgentCommandCenterWorkspaceProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  position?: 'primary' | 'secondary';
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

const AgentCommandCenterWorkspace: React.FC<AgentCommandCenterWorkspaceProps> = ({
  agentId,
  agentName,
  onClose,
  position = 'primary'
}) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      content: `Hello! I'm ${agentName}, your AI collaboration partner. I'm specialized in data analysis, content writing, creative tasks. How can I assist you today?`,
      sender: 'agent',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [agentName]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || chatLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: messageInput.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessageInput('');
    setChatLoading(true);

    // Simulate agent response
    setTimeout(() => {
      const agentResponse: Message = {
        id: `agent_${Date.now()}`,
        content: `I understand you'd like help with "${userMessage.content}". I'm ready to assist you with this task. Let me know if you need me to create content, analyze data, or help with any other collaborative work.`,
        sender: 'agent',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, agentResponse]);
      setChatLoading(false);
    }, 1000);
  };

  const showIntroScreen = messages.length <= 1;

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}
          >
            {agentName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {agentName}
              </Typography>
              <Chip
                label="AI Agent"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '10px',
                  fontWeight: 600,
                  bgcolor: theme.palette.primary.main,
                  color: 'white'
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              AI Agent Command Center
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Position Indicator */}
          {position === 'secondary' && (
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: theme.palette.primary.main + '20',
                color: theme.palette.primary.main,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '10px',
                fontWeight: 600
              }}
            >
              SPLIT
            </Typography>
          )}
          
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {showIntroScreen ? (
          /* Command Center Intro Screen - Adapts to width */
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: position === 'secondary' ? 2 : 4, // Less padding in split mode
              py: 3
            }}
          >
            {/* Personalized Greeting - Responsive text size */}
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.text.primary,
                mb: 1,
                fontWeight: 500,
                fontSize: position === 'secondary' 
                  ? { xs: '1.2rem', sm: '1.5rem' }  // Smaller in split mode
                  : { xs: '1.5rem', sm: '2rem', md: '2.5rem' } // Full size in single mode
              }}
            >
              Hello {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                mb: position === 'secondary' ? 3 : 6, // Less margin in split mode
                fontWeight: 400,
                fontSize: position === 'secondary'
                  ? { xs: '0.9rem', sm: '1rem' }  // Smaller in split mode
                  : { xs: '1rem', sm: '1.2rem', md: '1.4rem' } // Full size in single mode
              }}
            >
              What can I do for you?
            </Typography>

            {/* Centered Chat Input Box - Responsive width */}
            <Box
              sx={{
                width: '100%',
                maxWidth: position === 'secondary' ? '400px' : '500px', // Smaller max width in split mode
                mb: position === 'secondary' ? 2 : 4 // Less margin in split mode
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9',
                  borderRadius: '24px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#4b5563' : '#cbd5e1'}`,
                  overflow: 'hidden',
                  '&:focus-within': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    variant="standard"
                    disabled={chatLoading}
                    InputProps={{
                      disableUnderline: true,
                      sx: {
                        color: theme.palette.text.primary,
                        fontSize: position === 'secondary' ? '0.9rem' : '1rem', // Smaller font in split mode
                        px: 2,
                        py: 1.5,
                        '& input::placeholder': {
                          color: theme.palette.text.secondary,
                          opacity: 0.7
                        }
                      }
                    }}
                  />

                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || chatLoading}
                    sx={{
                      color: messageInput.trim() ? theme.palette.primary.main : theme.palette.text.secondary,
                      '&:hover': {
                        color: theme.palette.primary.dark,
                        bgcolor: theme.palette.primary.main + '10'
                      },
                      mr: 1
                    }}
                  >
                    {chatLoading ? <CircularProgress size={20} /> : <Send sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Box>
              </Box>
            </Box>

            {/* Tool Suggestion Buttons - Responsive grid */}
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: position === 'secondary' ? 1 : 2, // Smaller gaps in split mode
                justifyContent: 'center',
                maxWidth: position === 'secondary' ? '400px' : '500px'
              }}
            >
              {[
                { icon: '🖼️', label: 'Image', action: () => setMessageInput('Create an image of ') },
                { icon: '📊', label: 'Slides', action: () => setMessageInput('Create a presentation about ') },
                { icon: '🌐', label: 'Webpage', action: () => setMessageInput('Build a webpage for ') },
                { icon: '📈', label: 'Spreadsheet', action: () => setMessageInput('Create a spreadsheet for ') },
                { icon: '📊', label: 'Visualization', action: () => setMessageInput('Create a data visualization of ') },
                { icon: '➕', label: 'More', action: () => setMessageInput('Help me with ') }
              ].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  onClick={suggestion.action}
                  sx={{
                    borderColor: theme.palette.mode === 'dark' ? '#4b5563' : '#cbd5e1',
                    color: theme.palette.text.primary,
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(248, 250, 252, 0.8)',
                    '&:hover': {
                      borderColor: theme.palette.mode === 'dark' ? '#6b7280' : '#94a3b8',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(75, 85, 99, 0.8)' : 'rgba(226, 232, 240, 0.8)'
                    },
                    px: position === 'secondary' ? 1.5 : 2, // Smaller padding in split mode
                    py: position === 'secondary' ? 0.5 : 1,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: position === 'secondary' ? '0.7rem' : '0.75rem', // Smaller font in split mode
                    fontWeight: 500,
                    minWidth: 'auto'
                  }}
                >
                  <Box sx={{ mr: position === 'secondary' ? 0.5 : 1, fontSize: position === 'secondary' ? '0.8rem' : '0.9rem' }}>
                    {suggestion.icon}
                  </Box>
                  {suggestion.label}
                </Button>
              ))}
            </Box>
          </Box>
        ) : (
          /* Chat Messages - Responsive layout */
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, p: position === 'secondary' ? 2 : 3, overflow: 'auto' }}>
              <Stack spacing={position === 'secondary' ? 2 : 3}>
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      display: 'flex',
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: position === 'secondary' ? 1.5 : 2, // Smaller padding in split mode
                        borderRadius: 2,
                        bgcolor: message.sender === 'user' 
                          ? theme.palette.primary.main 
                          : theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9',
                        color: message.sender === 'user' 
                          ? 'white' 
                          : theme.palette.text.primary
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ fontSize: position === 'secondary' ? '0.85rem' : '1rem' }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {chatLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9'
                      }}
                    >
                      <CircularProgress size={20} />
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Chat Input - Responsive */}
            <Box sx={{ 
              p: position === 'secondary' ? 2 : 3, 
              borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}` 
            }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f1f5f9',
                  borderRadius: '12px',
                  p: 1
                }}
              >
                <TextField
                  fullWidth
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  variant="standard"
                  disabled={chatLoading}
                  InputProps={{
                    disableUnderline: true,
                    sx: {
                      color: theme.palette.text.primary,
                      px: 2,
                      fontSize: position === 'secondary' ? '0.9rem' : '1rem',
                      '& input::placeholder': {
                        color: theme.palette.text.secondary,
                        opacity: 0.7
                      }
                    }
                  }}
                />
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || chatLoading}
                  sx={{
                    color: messageInput.trim() ? theme.palette.primary.main : theme.palette.text.secondary,
                    '&:hover': { color: theme.palette.primary.dark }
                  }}
                >
                  {chatLoading ? <CircularProgress size={20} /> : <Send />}
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AgentCommandCenterWorkspace;

