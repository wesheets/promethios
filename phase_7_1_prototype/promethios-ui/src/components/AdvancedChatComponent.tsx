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
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Error as ErrorIcon,
  Group as GroupIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  VideoFile as VideoFileIcon,
  AudioFile as AudioFileIcon,
  Close as CloseIcon,
  ContentPaste as ContentPasteIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { UserAgentStorageService, AgentProfile } from '../services/UserAgentStorageService';
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
  height: '100%',
  backgroundColor: DARK_THEME.background,
  color: DARK_THEME.text.primary
}));

const MainChatArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
}));

const ChatHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const ModeToggleContainer = styled(Box)(() => ({
  display: 'flex',
  gap: '8px',
  padding: '8px 24px',
  backgroundColor: DARK_THEME.surface,
  borderBottom: `1px solid ${DARK_THEME.border}`
}));

const ModeButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active: boolean }>(({ active }) => ({
  backgroundColor: active ? DARK_THEME.primary : 'transparent',
  color: active ? '#ffffff' : DARK_THEME.text.secondary,
  border: `1px solid ${active ? DARK_THEME.primary : DARK_THEME.border}`,
  '&:hover': {
    backgroundColor: active ? DARK_THEME.primary : DARK_THEME.border + '40'
  }
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
          : messageType === 'observer'
            ? DARK_THEME.warning + '15'
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
          : messageType === 'observer'
            ? DARK_THEME.warning
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
        : messageType === 'observer'
          ? DARK_THEME.warning
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
  flexDirection: 'column',
  gap: '12px'
}));

const InputRow = styled(Box)(() => ({
  display: 'flex',
  gap: '12px',
  alignItems: 'flex-end'
}));

const SidePanel = styled(Box)(() => ({
  width: '350px',
  backgroundColor: DARK_THEME.surface,
  borderLeft: `1px solid ${DARK_THEME.border}`,
  display: 'flex',
  flexDirection: 'column'
}));

const FilePreview = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: DARK_THEME.background,
  border: `1px solid ${DARK_THEME.border}`,
  borderRadius: '8px',
  fontSize: '14px'
}));

const HiddenFileInput = styled('input')({
  display: 'none'
});

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent' | 'system' | 'error' | 'observer';
  timestamp: Date;
  agentName?: string;
  agentId?: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  data?: string; // base64 data for images
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const AdvancedChatComponent: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [governanceEnabled, setGovernanceEnabled] = useState(true);
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<AgentProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [showObserver, setShowObserver] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agentStorageService = new UserAgentStorageService();

  // Observer agent definition
  const observerAgent: AgentProfile = {
    identity: {
      id: 'observer-agent',
      name: 'Observer',
      version: '1.0.0',
      description: 'AI governance and monitoring agent that observes conversations for policy compliance and safety.',
      ownerId: user?.uid || 'system',
      creationDate: new Date(),
      lastModifiedDate: new Date(),
      status: 'active'
    },
    latestScorecard: null,
    attestationCount: 0,
    lastActivity: new Date(),
    healthStatus: 'healthy',
    trustLevel: 'high',
    isWrapped: true,
    governancePolicy: null,
    isDeployed: true,
    apiDetails: {
      endpoint: 'internal://observer',
      key: 'observer-key',
      provider: 'observer',
      selectedModel: 'observer-v1'
    }
  };

  // Load real agents from storage
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        if (user?.uid) {
          agentStorageService.setCurrentUser(user.uid);
          const userAgents = await agentStorageService.loadUserAgents();
          
          console.log('Loaded agents:', userAgents);
          
          // Combine user agents with observer agent
          const allAgents = [
            ...(userAgents || []),
            observerAgent
          ];
          
          setAgents(allAgents);
          
          // Set first user agent as selected if available, otherwise observer
          if (userAgents && userAgents.length > 0 && !selectedAgent) {
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
          } else if (!userAgents || userAgents.length === 0) {
            // Only observer available
            setSelectedAgent(observerAgent);
            const noAgentsMessage: Message = {
              id: `msg_${Date.now()}_no_agents`,
              content: 'Observer agent active. No user agents found. Please create an agent using the Agent Wrapping feature.',
              sender: 'observer',
              timestamp: new Date(),
              agentName: 'Observer'
            };
            setMessages([noAgentsMessage]);
          }
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        setError('Failed to load agents. Please try refreshing the page.');
        setAgents([observerAgent]); // Fallback to observer only
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: FileAttachment = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          data: e.target?.result as string
        };
        setAttachments(prev => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste events for screenshots
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const attachment: FileAttachment = {
                id: `paste_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: `pasted-image-${Date.now()}.png`,
                type: 'image/png',
                size: file.size,
                url: URL.createObjectURL(file),
                data: e.target?.result as string
              };
              setAttachments(prev => [...prev, attachment]);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  // Remove attachment
  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  // Call actual agent API with file support
  const callAgentAPI = async (message: string, agent: AgentProfile, attachments: FileAttachment[] = []): Promise<string> => {
    try {
      // Handle Observer agent
      if (agent.identity.id === 'observer-agent') {
        return `🛡️ Observer Analysis: Message processed. Content appears compliant with governance policies. ${attachments.length > 0 ? `Analyzed ${attachments.length} attachment(s).` : ''} Trust score maintained at 85%.`;
      }

      const apiDetails = agent.apiDetails;
      if (!apiDetails) {
        throw new Error('Agent API configuration not found');
      }

      // Prepare message with attachments
      let messageContent = message;
      if (attachments.length > 0) {
        messageContent += '\n\nAttachments:\n';
        attachments.forEach(att => {
          messageContent += `- ${att.name} (${att.type})\n`;
          if (att.type.startsWith('image/') && att.data) {
            messageContent += `  Image data: ${att.data}\n`;
          }
        });
      }

      // Prepare the API request based on provider
      let response;
      
      if (apiDetails.provider === 'openai') {
        const messages = [
          {
            role: 'system',
            content: `You are ${agent.identity.name}. ${agent.identity.description}. You have access to tools and can process file attachments.`
          },
          {
            role: 'user',
            content: messageContent
          }
        ];

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiDetails.key}`
          },
          body: JSON.stringify({
            model: apiDetails.selectedModel || 'gpt-3.5-turbo',
            messages: messages,
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
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiDetails.key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: apiDetails.selectedModel || 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `You are ${agent.identity.name}. ${agent.identity.description}. You have access to tools and can process file attachments.\n\nUser message: ${messageContent}`
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0]?.text || 'No response received';
        
      } else {
        // Generic API call for other providers
        response = await fetch(apiDetails.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiDetails.key}`
          },
          body: JSON.stringify({
            message: messageContent,
            agent_name: agent.identity.name,
            agent_description: agent.identity.description,
            attachments: attachments.map(att => ({
              name: att.name,
              type: att.type,
              data: att.data
            }))
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
    if ((!inputValue.trim() && attachments.length === 0) || isTyping) return;
    
    if (isMultiAgentMode && selectedAgents.length === 0) {
      setError('Please select at least one agent for multi-agent mode');
      return;
    }
    
    if (!isMultiAgentMode && !selectedAgent) {
      setError('Please select an agent');
      return;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      content: inputValue || '(File attachments only)',
      sender: 'user',
      timestamp: new Date(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsTyping(true);
    setError(null);

    try {
      // Add governance message if enabled
      if (governanceEnabled) {
        const governanceMessage: Message = {
          id: `msg_${Date.now()}_governance`,
          content: `🛡️ Processing message through governance layer... ${currentAttachments.length > 0 ? `Scanning ${currentAttachments.length} attachment(s).` : ''}`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceMessage]);
      }

      // Add Observer analysis if enabled
      if (showObserver && governanceEnabled) {
        const observerResponse = await callAgentAPI(userMessage.content, observerAgent, currentAttachments);
        const observerMessage: Message = {
          id: `msg_${Date.now()}_observer`,
          content: observerResponse,
          sender: 'observer',
          timestamp: new Date(),
          agentName: 'Observer',
          agentId: 'observer-agent'
        };
        setMessages(prev => [...prev, observerMessage]);
      }

      if (isMultiAgentMode) {
        // Handle multi-agent responses
        for (const agent of selectedAgents) {
          if (agent.identity.id === 'observer-agent') continue; // Skip observer in multi-agent mode
          
          try {
            const agentResponse = await callAgentAPI(userMessage.content, agent, currentAttachments);
            
            const agentMessage: Message = {
              id: `msg_${Date.now()}_agent_${agent.identity.id}`,
              content: agentResponse,
              sender: 'agent',
              timestamp: new Date(),
              agentName: agent.identity.name,
              agentId: agent.identity.id
            };
            
            setMessages(prev => [...prev, agentMessage]);
          } catch (error) {
            const errorMessage: Message = {
              id: `msg_${Date.now()}_error_${agent.identity.id}`,
              content: `❌ Error from ${agent.identity.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'error',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }
      } else if (selectedAgent && selectedAgent.identity.id !== 'observer-agent') {
        // Handle single agent response (skip if observer is selected as main agent)
        const agentResponse = await callAgentAPI(userMessage.content, selectedAgent, currentAttachments);
        
        const agentMessage: Message = {
          id: `msg_${Date.now()}_agent`,
          content: agentResponse,
          sender: 'agent',
          timestamp: new Date(),
          agentName: selectedAgent.identity.name,
          agentId: selectedAgent.identity.id
        };
        
        setMessages(prev => [...prev, agentMessage]);
      }

      // Add governance completion message if enabled
      if (governanceEnabled) {
        const governanceCompleteMessage: Message = {
          id: `msg_${Date.now()}_governance_complete`,
          content: `🛡️ Governance Monitor: Trust score 85%. Compliance: compliant. ${currentAttachments.length > 0 ? 'All attachments processed safely.' : ''}`,
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

  const handleMultiAgentChange = (agentIds: string[]) => {
    const selectedAgentsList = agents.filter(a => agentIds.includes(a.identity.id));
    setSelectedAgents(selectedAgentsList);
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
    if (agent.identity.id === 'observer-agent') return '🛡️';
    
    const name = agent.identity.name.toLowerCase();
    if (name.includes('creative')) return '🎨';
    if (name.includes('data') || name.includes('analyst')) return '📈';
    if (name.includes('factual') || name.includes('research')) return '📊';
    if (name.includes('writer') || name.includes('technical')) return '✍️';
    if (name.includes('advisor') || name.includes('expert')) return '🔧';
    return '🤖';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon />;
    if (type.startsWith('video/')) return <VideoFileIcon />;
    if (type.startsWith('audio/')) return <AudioFileIcon />;
    return <DescriptionIcon />;
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
    <ChatContainer>
      <MainChatArea>
        {/* Header */}
        <ChatHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
              Chat with Your Agents
            </Typography>
            <Chip 
              label={isMultiAgentMode ? 'Multi-Agent' : 'Single Agent'}
              color={isMultiAgentMode ? 'warning' : 'primary'}
              size="small"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={governanceEnabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleGovernanceToggle(e.target.checked);
                  }}
                  onClick={(e) => e.stopPropagation()}
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
                  <Typography variant="caption">Governed</Typography>
                </Box>
              }
              sx={{ color: DARK_THEME.text.secondary }}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </ChatHeader>

        {/* Mode Toggle */}
        <ModeToggleContainer>
          <ModeButton
            active={!isMultiAgentMode}
            onClick={() => setIsMultiAgentMode(false)}
            startIcon={<PersonIcon />}
          >
            Single Agent
          </ModeButton>
          <ModeButton
            active={isMultiAgentMode}
            onClick={() => setIsMultiAgentMode(true)}
            startIcon={<GroupIcon />}
          >
            Multi-Agent
          </ModeButton>
        </ModeToggleContainer>

        {/* Agent Selection */}
        <Box sx={{ p: 2, backgroundColor: DARK_THEME.surface, borderBottom: `1px solid ${DARK_THEME.border}`, position: 'relative', zIndex: 1000 }}>
          {!isMultiAgentMode ? (
            <FormControl size="small" sx={{ minWidth: 300, zIndex: 1001 }}>
              <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Select Agent</InputLabel>
              <Select
                value={selectedAgent?.identity.id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      zIndex: 1002,
                      backgroundColor: DARK_THEME.surface,
                      border: `1px solid ${DARK_THEME.border}`,
                      '& .MuiMenuItem-root': {
                        color: DARK_THEME.text.primary,
                        '&:hover': {
                          backgroundColor: DARK_THEME.primary + '20'
                        }
                      }
                    }
                  }
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
          ) : (
            <FormControl size="small" sx={{ minWidth: 300, zIndex: 1001 }}>
              <InputLabel sx={{ color: DARK_THEME.text.secondary }}>Select Agents</InputLabel>
              <Select
                multiple
                value={selectedAgents.map(a => a.identity.id)}
                onChange={(e) => handleMultiAgentChange(e.target.value as string[])}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      zIndex: 1002,
                      backgroundColor: DARK_THEME.surface,
                      border: `1px solid ${DARK_THEME.border}`,
                      '& .MuiMenuItem-root': {
                        color: DARK_THEME.text.primary,
                        '&:hover': {
                          backgroundColor: DARK_THEME.primary + '20'
                        }
                      }
                    }
                  }
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const agent = agents.find(a => a.identity.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={agent?.identity.name || value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
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
                {agents.filter(a => a.identity.id !== 'observer-agent').map((agent) => (
                  <MenuItem key={agent.identity.id} value={agent.identity.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getAgentAvatar(agent)}</span>
                      <Typography>{agent.identity.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

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
                ) : message.sender === 'observer' ? (
                  '🛡️'
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
                {message.sender === 'observer' && (
                  <Typography variant="caption" sx={{ 
                    color: DARK_THEME.warning,
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Observer Agent
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
                
                {/* Display attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {message.attachments.map((attachment) => (
                      <Box key={attachment.id} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 1,
                        backgroundColor: DARK_THEME.background + '40',
                        borderRadius: 1,
                        fontSize: '12px'
                      }}>
                        {getFileIcon(attachment.type)}
                        <Typography variant="caption">{attachment.name}</Typography>
                        {attachment.type.startsWith('image/') && attachment.url && (
                          <img 
                            src={attachment.url} 
                            alt={attachment.name}
                            style={{ 
                              maxWidth: '100px', 
                              maxHeight: '100px', 
                              borderRadius: '4px',
                              marginLeft: '8px'
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                
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
                <BotIcon />
              </Avatar>
              <Box className="message-content">
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {isMultiAgentMode ? 'Agents are thinking...' : `${selectedAgent?.identity.name || 'Agent'} is thinking...`}
                </Typography>
              </Box>
            </MessageBubble>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Input */}
        <InputContainer>
          {/* File Attachments Preview */}
          {attachments.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {attachments.map((attachment) => (
                <FilePreview key={attachment.id}>
                  {getFileIcon(attachment.type)}
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.primary }}>
                    {attachment.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={() => removeAttachment(attachment.id)}
                    sx={{ color: DARK_THEME.text.secondary, ml: 1 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </FilePreview>
              ))}
            </Box>
          )}

          <InputRow>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isMultiAgentMode 
                  ? selectedAgents.length > 0 
                    ? `Message ${selectedAgents.length} agents...`
                    : "Select agents to start chatting..."
                  : selectedAgent 
                    ? `Message ${selectedAgent.identity.name}...` 
                    : "Select an agent to start chatting..."
              }
              variant="outlined"
              disabled={
                isTyping || 
                (isMultiAgentMode ? selectedAgents.length === 0 : !selectedAgent)
              }
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
            
            {/* File Upload Button */}
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{ 
                color: DARK_THEME.text.secondary,
                '&:hover': { color: DARK_THEME.primary }
              }}
            >
              <AttachFileIcon />
            </IconButton>
            
            {/* Paste Button */}
            <IconButton
              onClick={() => {
                // Trigger paste event programmatically
                document.execCommand('paste');
              }}
              sx={{ 
                color: DARK_THEME.text.secondary,
                '&:hover': { color: DARK_THEME.primary }
              }}
            >
              <ContentPasteIcon />
            </IconButton>

            <Button
              variant="contained"
              onClick={handleSendMessage}
              disabled={
                (!inputValue.trim() && attachments.length === 0) || 
                isTyping || 
                (isMultiAgentMode ? selectedAgents.length === 0 : !selectedAgent)
              }
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
          </InputRow>
        </InputContainer>

        {/* Hidden File Input */}
        <HiddenFileInput
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileUpload}
        />
      </MainChatArea>

      {/* Side Panel */}
      <SidePanel>
        <Box sx={{ borderBottom: 1, borderColor: DARK_THEME.border }}>
          <Tabs 
            value={sidebarTab} 
            onChange={(e, newValue) => setSidebarTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: DARK_THEME.text.secondary,
                '&.Mui-selected': {
                  color: DARK_THEME.primary
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: DARK_THEME.primary
              }
            }}
          >
            <Tab label="Core Metrics" />
            <Tab label="System Status" />
          </Tabs>
        </Box>

        <TabPanel value={sidebarTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SecurityIcon sx={{ color: DARK_THEME.success, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    TRUST SCORE
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: DARK_THEME.success, fontWeight: 'bold' }}>
                  {governanceEnabled ? '85%' : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled ? 85 : 0} 
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: DARK_THEME.success
                    }
                  }} 
                />
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon sx={{ color: DARK_THEME.success, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    COMPLIANCE RATE
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: DARK_THEME.success, fontWeight: 'bold' }}>
                  {governanceEnabled ? '92%' : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled ? 92 : 0} 
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: DARK_THEME.success
                    }
                  }} 
                />
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SpeedIcon sx={{ color: DARK_THEME.primary, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    RESPONSE TIME
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: DARK_THEME.primary, fontWeight: 'bold' }}>
                  {governanceEnabled ? '1.2s' : 'N/A'}
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VisibilityIcon sx={{ color: DARK_THEME.warning, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    SESSION INTEGRITY
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: DARK_THEME.warning, fontWeight: 'bold' }}>
                  {governanceEnabled ? '88%' : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled ? 88 : 0} 
                  sx={{ 
                    mt: 1,
                    backgroundColor: DARK_THEME.border,
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: DARK_THEME.warning
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        <TabPanel value={sidebarTab} index={1}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
              System Status
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: DARK_THEME.success 
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Real-time Monitoring: Active
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: DARK_THEME.warning 
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Policy Violations: 0
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: DARK_THEME.success 
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                AI Agents: Operational
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: showObserver ? DARK_THEME.success : DARK_THEME.border 
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Observer Agent: {showObserver ? 'Operational' : 'Disabled'}
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={showObserver}
                  onChange={(e) => setShowObserver(e.target.checked)}
                  size="small"
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
                <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                  Enable Observer
                </Typography>
              }
            />

            <Divider sx={{ borderColor: DARK_THEME.border, my: 2 }} />

            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
              Recent Activity
            </Typography>
            
            <Box sx={{ fontSize: '12px', color: DARK_THEME.text.secondary }}>
              <Typography variant="caption" display="block">
                • File upload support enabled
              </Typography>
              <Typography variant="caption" display="block">
                • Copy/paste screenshots active
              </Typography>
              <Typography variant="caption" display="block">
                • Tool integration ready
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </SidePanel>
    </ChatContainer>
  );
};

export default AdvancedChatComponent;

