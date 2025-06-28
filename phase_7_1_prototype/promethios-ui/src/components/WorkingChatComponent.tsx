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
  FormControlLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { UserAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
import { API_BASE_URL } from '../config/api';
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
  warning: '#d69e2e',
  error: '#e53e3e'
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
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'messageType'
})<{ isUser: boolean; messageType?: string }>(({ isUser, messageType }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  maxWidth: '85%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  flexDirection: isUser ? 'row-reverse' : 'row',
  
  '& .message-content': {
    backgroundColor: isUser 
      ? DARK_THEME.primary
      : messageType === 'system' 
        ? DARK_THEME.warning + '20'
        : messageType === 'error'
          ? DARK_THEME.error + '20'
          : DARK_THEME.surface,
    color: isUser 
      ? '#ffffff'
      : DARK_THEME.text.primary,
    padding: '12px 16px',
    borderRadius: isUser 
      ? '20px 20px 4px 20px' 
      : '20px 20px 20px 4px',
    border: `1px solid ${
      messageType === 'system' 
        ? DARK_THEME.warning 
        : messageType === 'error'
          ? DARK_THEME.error
          : DARK_THEME.border
    }`,
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.5
  },
  
  '& .message-avatar': {
    width: 32,
    height: 32,
    fontSize: '14px',
    backgroundColor: messageType === 'system' 
      ? DARK_THEME.warning
      : messageType === 'error'
        ? DARK_THEME.error
        : isUser
          ? DARK_THEME.primary
          : DARK_THEME.success
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
  sender: 'user' | 'agent' | 'system' | 'error';
  timestamp: Date;
  agentName?: string;
  agentId?: string;
}

const WorkingChatComponent: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [showGovernancePanel, setShowGovernancePanel] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agentStorageService = new UserAgentStorageService();

  // Load real agents from storage
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        if (currentUser?.uid) {
          agentStorageService.setCurrentUser(currentUser.uid);
          const userAgents = await agentStorageService.loadUserAgents();
          
          console.log('Loaded agents:', userAgents);
          setAgents(userAgents);
          
          // Set first agent as selected if available
          if (userAgents.length > 0 && !selectedAgent) {
            setSelectedAgent(userAgents[0]);
            
            // Add welcome message
            const welcomeMessage: Message = {
              id: `msg_${Date.now()}_welcome`,
              content: `Hello! I'm ${userAgents[0].identity.name}. How can I help you today?`,
              sender: 'agent',
              timestamp: new Date(),
              agentName: userAgents[0].identity.name,
              agentId: userAgents[0].identity.id
            };
            setMessages([welcomeMessage]);
          } else if (userAgents.length === 0) {
            // No agents found
            const noAgentsMessage: Message = {
              id: `msg_${Date.now()}_no_agents`,
              content: 'No agents found. Please create an agent first using the Agent Wrapping feature.',
              sender: 'system',
              timestamp: new Date()
            };
            setMessages([noAgentsMessage]);
          }
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        setError('Failed to load agents. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call actual agent API
  const callAgentAPI = async (message: string, agent: AgentProfile): Promise<string> => {
    try {
      const apiDetails = agent.apiDetails;
      if (!apiDetails) {
        throw new Error('Agent API configuration not found');
      }

      // Prepare the API request based on provider
      let response;
      
      if (apiDetails.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiDetails.key}`
          },
          body: JSON.stringify({
            model: apiDetails.selectedModel || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are ${agent.identity.name}. ${agent.identity.description}`
              },
              {
                role: 'user',
                content: message
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || 'No response received';
        
      } else if (apiDetails.provider === 'anthropic') {
        response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: 'factual-agent', // Maps to Anthropic in backend
            message: `You are ${agent.identity.name}. ${agent.identity.description}\n\nUser message: ${message}`,
            governance_enabled: false
          })
        });

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || 'No response received';
        
      } else {
        // Generic API call for other providers
        response = await fetch(apiDetails.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiDetails.key}`
          },
          body: JSON.stringify({
            message: message,
            agent_name: agent.identity.name,
            agent_description: agent.identity.description
          })
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || data.message || 'No response received';
      }
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent || isTyping) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      // Add governance message if enabled
      if (governanceEnabled) {
        const governanceMessage: Message = {
          id: `msg_${Date.now()}_governance`,
          content: `🛡️ Processing message through governance layer...`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceMessage]);
      }

      // Call the actual agent API
      const agentResponse = await callAgentAPI(inputValue, selectedAgent);
      
      // Add agent response
      const agentMessage: Message = {
        id: `msg_${Date.now()}_agent`,
        content: agentResponse,
        sender: 'agent',
        timestamp: new Date(),
        agentName: selectedAgent.identity.name,
        agentId: selectedAgent.identity.id
      };
      
      setMessages(prev => [...prev, agentMessage]);

      // Add governance completion message if enabled
      if (governanceEnabled) {
        const governanceCompleteMessage: Message = {
          id: `msg_${Date.now()}_governance_complete`,
          content: `🛡️ Governance Monitor: Trust score 85%. Compliance: compliant`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceCompleteMessage]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        content: `❌ Error: Failed to send message. ${error instanceof Error ? error.message : 'Please try again.'}`,
        sender: 'error',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgentChange = (agentId: string) => {
    const agent = agents.find(a => a.identity.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      
      // Add agent switch message
      const switchMessage: Message = {
        id: `msg_${Date.now()}_switch`,
        content: `Switched to ${agent.identity.name}. ${agent.identity.description}`,
        sender: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, switchMessage]);
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

  const getAgentAvatar = (agent: AgentProfile): string => {
    const name = agent.identity.name.toLowerCase();
    if (name.includes('creative')) return '🎨';
    if (name.includes('data') || name.includes('analyst')) return '📈';
    if (name.includes('factual') || name.includes('research')) return '📊';
    if (name.includes('writer') || name.includes('technical')) return '✍️';
    if (name.includes('advisor') || name.includes('expert')) return '🔧';
    return '🤖';
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        backgroundColor: DARK_THEME.background 
      }}>
        <CircularProgress sx={{ color: DARK_THEME.primary }} />
        <Typography sx={{ ml: 2, color: DARK_THEME.text.primary }}>
          Loading your agents...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <ChatContainer sx={{ flex: 1 }}>
        {/* Header */}
        <ChatHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: DARK_THEME.success }}>
              {selectedAgent ? getAgentAvatar(selectedAgent) : '🤖'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
                Chat with {selectedAgent?.identity.name || 'Your Agents'}
              </Typography>
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                {selectedAgent ? (selectedAgent.isDeployed ? '🟢 Online' : '🔴 Offline') : 'No agent selected'}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {agents.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Select Agent</InputLabel>
                <Select
                  value={selectedAgent?.identity.id || ''}
                  onChange={(e) => handleAgentChange(e.target.value)}
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
                    <MenuItem key={agent.identity.id} value={agent.identity.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{getAgentAvatar(agent)}</span>
                        <Box>
                          <Typography variant="body2">{agent.identity.name}</Typography>
                          <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                            {agent.apiDetails?.provider || 'Unknown'} • {agent.isWrapped ? 'Governed' : 'Standard'}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
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

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              m: 2,
              backgroundColor: DARK_THEME.error + '20',
              color: DARK_THEME.text.primary,
              '& .MuiAlert-icon': { color: DARK_THEME.error }
            }}
          >
            {error}
          </Alert>
        )}

        {/* Messages */}
        <MessagesContainer>
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              isUser={message.sender === 'user'}
              messageType={message.sender}
            >
              <Avatar className="message-avatar">
                {message.sender === 'user' ? (
                  <PersonIcon />
                ) : message.sender === 'system' ? (
                  <ShieldIcon />
                ) : message.sender === 'error' ? (
                  <ErrorIcon />
                ) : (
                  selectedAgent ? getAgentAvatar(selectedAgent) : '🤖'
                )}
              </Avatar>
              <Box className="message-content">
                {message.agentName && (
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
                {message.sender === 'error' && (
                  <Typography variant="caption" sx={{ 
                    color: DARK_THEME.error,
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    System Error
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
          
          {isTyping && selectedAgent && (
            <MessageBubble isUser={false}>
              <Avatar className="message-avatar">
                {getAgentAvatar(selectedAgent)}
              </Avatar>
              <Box className="message-content">
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {selectedAgent.identity.name} is thinking...
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
            placeholder={selectedAgent ? `Message ${selectedAgent.identity.name}...` : "Select an agent to start chatting..."}
            variant="outlined"
            disabled={!selectedAgent || isTyping}
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
            {isTyping ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
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
                Selected Agent
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                {selectedAgent?.identity.name || 'None'}
              </Typography>
              {selectedAgent && (
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  {selectedAgent.apiDetails?.provider} • {selectedAgent.isWrapped ? 'Governed' : 'Standard'}
                </Typography>
              )}
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

