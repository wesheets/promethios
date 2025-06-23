import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
  warning: '#d69e2e'
};

const ChatContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: DARK_THEME.background,
  color: DARK_THEME.text.primary
}));

const ChatHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  padding: '16px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  backgroundColor: DARK_THEME.background,
  
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: DARK_THEME.border,
    borderRadius: '3px'
  }
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser'
})<{ isUser: boolean }>(({ isUser }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  maxWidth: '85%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  flexDirection: isUser ? 'row-reverse' : 'row',
  
  '& .message-content': {
    backgroundColor: isUser ? DARK_THEME.primary : DARK_THEME.surface,
    color: DARK_THEME.text.primary,
    padding: '12px 16px',
    borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
    border: `1px solid ${DARK_THEME.border}`,
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.5
  },
  
  '& .message-avatar': {
    width: 32,
    height: 32,
    fontSize: '14px',
    backgroundColor: isUser ? DARK_THEME.primary : DARK_THEME.success
  }
}));

const InputContainer = styled(Box)(() => ({
  padding: '16px 24px',
  borderTop: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end'
}));

const GovernancePanel = styled(Box)(() => ({
  width: '300px',
  backgroundColor: DARK_THEME.surface,
  borderLeft: `1px solid ${DARK_THEME.border}`,
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}));

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  agentName?: string;
}

interface SimpleAgent {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  type: string;
}

const WorkingChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      sender: 'agent',
      timestamp: new Date(),
      agentName: 'Assistant'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<SimpleAgent | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [showGovernancePanel, setShowGovernancePanel] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simple demo agents - no complex loading
  const agents: SimpleAgent[] = [
    { id: 'assistant', name: 'Assistant', avatar: '🤖', status: 'online', type: 'general' },
    { id: 'creative', name: 'Creative Agent', avatar: '🎨', status: 'online', type: 'creative' },
    { id: 'analyst', name: 'Data Analyst', avatar: '📊', status: 'online', type: 'analytical' },
    { id: 'writer', name: 'Technical Writer', avatar: '✍️', status: 'online', type: 'writing' }
  ];

  // Initialize with first agent
  useEffect(() => {
    if (!selectedAgent && agents.length > 0) {
      setSelectedAgent(agents[0]);
    }
  }, [selectedAgent]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Add governance message if enabled
    if (governanceEnabled) {
      setTimeout(() => {
        const governanceMessage: Message = {
          id: `msg_${Date.now()}_governance`,
          content: `🛡️ Message processed through governance layer. Trust score: 85%. No policy violations detected.`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceMessage]);
      }, 500);
    }

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: `msg_${Date.now()}_agent`,
        content: `I understand you said: "${userMessage.content}". This is a demo response from ${selectedAgent.name}. ${governanceEnabled ? 'This response has been validated by the governance system.' : 'Operating in standard mode.'}`,
        sender: 'agent',
        timestamp: new Date(),
        agentName: selectedAgent.name
      };
      
      setMessages(prev => [...prev, agentMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1500);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleGovernanceToggle = (enabled: boolean) => {
    setGovernanceEnabled(enabled);
    
    const statusMessage: Message = {
      id: `msg_${Date.now()}_status`,
      content: `🛡️ Governance ${enabled ? 'enabled' : 'disabled'}. ${enabled ? 'All interactions will be monitored and scored.' : 'Operating in standard mode.'}`,
      sender: 'system',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, statusMessage]);
  };

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <ChatContainer sx={{ flex: 1 }}>
        {/* Header */}
        <ChatHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: DARK_THEME.success }}>
              {selectedAgent?.avatar || '🤖'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                Chat with {selectedAgent?.name || 'Agent'}
              </Typography>
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                {selectedAgent?.status === 'online' ? '🟢 Online' : '🔴 Offline'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Agent</InputLabel>
              <Select
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  if (agent) setSelectedAgent(agent);
                }}
                sx={{
                  color: DARK_THEME.text.primary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: DARK_THEME.border
                  },
                  '& .MuiSvgIcon-root': {
                    color: DARK_THEME.text.secondary
                  }
                }}
              >
                {agents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{agent.avatar}</span>
                      {agent.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={governanceEnabled}
                  onChange={(e) => handleGovernanceToggle(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: DARK_THEME.success
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: DARK_THEME.success
                    }
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShieldIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Governance</Typography>
                </Box>
              }
              sx={{ color: DARK_THEME.text.secondary }}
            />
            
            <IconButton
              onClick={() => setShowGovernancePanel(!showGovernancePanel)}
              sx={{ color: DARK_THEME.text.secondary }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </ChatHeader>

        {/* Messages */}
        <MessagesContainer>
          {messages.map((message) => (
            <MessageBubble key={message.id} isUser={message.sender === 'user'}>
              <Avatar className="message-avatar">
                {message.sender === 'user' ? (
                  <PersonIcon />
                ) : message.sender === 'system' ? (
                  <ShieldIcon />
                ) : (
                  selectedAgent?.avatar || '🤖'
                )}
              </Avatar>
              <Box className="message-content">
                {message.sender === 'agent' && message.agentName && (
                  <Typography variant="caption" sx={{ 
                    color: DARK_THEME.text.secondary,
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    {message.agentName}
                  </Typography>
                )}
                {message.sender === 'system' && (
                  <Typography variant="caption" sx={{ 
                    color: DARK_THEME.warning,
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Governance System
                  </Typography>
                )}
                <Typography variant="body2">
                  {message.content}
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: DARK_THEME.text.secondary,
                  display: 'block',
                  marginTop: '4px',
                  fontSize: '11px'
                }}>
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </MessageBubble>
          ))}
          
          {isTyping && (
            <MessageBubble isUser={false}>
              <Avatar className="message-avatar">
                {selectedAgent?.avatar || '🤖'}
              </Avatar>
              <Box className="message-content">
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {selectedAgent?.name || 'Agent'} is typing...
                </Typography>
              </Box>
            </MessageBubble>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Input */}
        <InputContainer>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: DARK_THEME.background,
                color: DARK_THEME.text.primary,
                '& fieldset': {
                  borderColor: DARK_THEME.border
                },
                '&:hover fieldset': {
                  borderColor: DARK_THEME.primary
                },
                '&.Mui-focused fieldset': {
                  borderColor: DARK_THEME.primary
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: DARK_THEME.text.secondary
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || !selectedAgent}
            sx={{
              backgroundColor: DARK_THEME.primary,
              minWidth: '48px',
              height: '48px',
              '&:hover': {
                backgroundColor: '#2c5aa0'
              }
            }}
          >
            <SendIcon />
          </Button>
        </InputContainer>
      </ChatContainer>

      {/* Governance Panel */}
      {showGovernancePanel && (
        <GovernancePanel>
          <Typography variant="h6" sx={{ color: DARK_THEME.text.primary, mb: 2 }}>
            Governance Dashboard
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper sx={{ p: 2, bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Trust Score
              </Typography>
              <Typography variant="h4" sx={{ color: governanceEnabled ? DARK_THEME.success : DARK_THEME.text.secondary }}>
                {governanceEnabled ? '85%' : 'N/A'}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Compliance Rate
              </Typography>
              <Typography variant="h4" sx={{ color: governanceEnabled ? DARK_THEME.success : DARK_THEME.text.secondary }}>
                {governanceEnabled ? '92%' : 'N/A'}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Policy Violations
              </Typography>
              <Typography variant="h4" sx={{ color: governanceEnabled ? DARK_THEME.success : DARK_THEME.text.secondary }}>
                {governanceEnabled ? '0' : 'N/A'}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mb: 1 }}>
                Status
              </Typography>
              <Chip 
                label={governanceEnabled ? 'Monitored' : 'Standard Mode'}
                color={governanceEnabled ? 'success' : 'default'}
                size="small"
              />
            </Paper>
          </Box>
        </GovernancePanel>
      )}
    </Box>
  );
};

export default WorkingChatComponent;

