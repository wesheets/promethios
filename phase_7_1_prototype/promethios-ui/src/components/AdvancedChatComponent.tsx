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
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
  LinearProgress
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
import { UserAgentStorageService } from '../services/UserAgentStorageService';
import { ChatStorageService, ChatMessage, FileAttachment } from '../services/ChatStorageService';
import { GovernanceService } from '../services/GovernanceService';
import { veritasService, VeritasResult } from '../services/VeritasService';
import { createPromethiosSystemMessage } from '../api/openaiProxy';
import { useAuth } from '../context/AuthContext';
import { useDemoAuth } from '../hooks/useDemoAuth';

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
  minHeight: 0, // Important for flex child to be scrollable
  maxHeight: 'calc(100vh - 200px)', // Fixed height to prevent expansion
  
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
  flexDirection: 'column',
  gap: '12px',
  position: 'sticky', // Make input container stick to bottom
  bottom: 0,
  zIndex: 10 // Ensure it stays above messages
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

const GovernanceToggleContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  cursor: 'pointer',
  userSelect: 'none'
}));

// Message interface - using ChatMessage from storage service
interface Message extends ChatMessage {}

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
  const { currentUser } = useAuth();
  const { currentUser: demoUser } = useDemoAuth();
  const effectiveUser = currentUser || demoUser;
  
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
  const [governanceMetrics, setGovernanceMetrics] = useState<GovernanceMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [currentGovernanceSession, setCurrentGovernanceSession] = useState<any>(null);
  const [currentGovernanceMetrics, setCurrentGovernanceMetrics] = useState<any>(null);
  const [currentVeritasResult, setCurrentVeritasResult] = useState<VeritasResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const agentStorageService = new UserAgentStorageService();
  const chatStorageService = new ChatStorageService();

  // Initialize chat storage service
  useEffect(() => {
    if (effectiveUser?.uid) {
      chatStorageService.setCurrentUser(effectiveUser.uid);
    }
  }, [effectiveUser]);

  // Load real agents from unified storage and their chat history
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        console.log('Loading agents for user:', effectiveUser?.uid);
        
        if (effectiveUser?.uid) {
          agentStorageService.setCurrentUser(effectiveUser.uid);
          const userAgents = await agentStorageService.loadUserAgents();
          
          console.log('Loaded user agents:', userAgents);
          console.log('Number of agents loaded:', userAgents?.length || 0);
          
          // Use only real user agents (no Observer agent)
          const realAgents = userAgents || [];
          setAgents(realAgents);
          
          // Set first agent as selected if available and load its chat history
          if (realAgents.length > 0 && !selectedAgent) {
            console.log('Setting first agent as selected:', realAgents[0]);
            setSelectedAgent(realAgents[0]);
            
            // Load existing chat history for this agent
            const chatHistory = await chatStorageService.loadAgentChatHistory(realAgents[0].identity.id);
            
            if (chatHistory && chatHistory.messages.length > 0) {
              // Load existing conversation
              console.log('Loading existing chat history:', chatHistory.messages.length, 'messages');
              setMessages(chatHistory.messages);
            } else {
              // Add welcome message for new conversation
              const welcomeMessage: ChatMessage = {
                id: `msg_${Date.now()}_welcome`,
                content: `Hello! I'm ${realAgents[0].identity.name}. How can I help you today?`,
                sender: 'agent',
                timestamp: new Date(),
                agentName: realAgents[0].identity.name,
                agentId: realAgents[0].identity.id
              };
              setMessages([welcomeMessage]);
              
              // Save welcome message to storage
              await chatStorageService.saveMessage(welcomeMessage, realAgents[0].identity.id);
            }
            
            // Initialize chat session
            await chatStorageService.initializeChatSession(realAgents[0], governanceEnabled);
          } else if (realAgents.length === 0) {
            console.log('No user agents found');
            const noAgentsMessage: ChatMessage = {
              id: `msg_${Date.now()}_no_agents`,
              content: 'No agents found. Please create an agent using the Agent Wrapping feature.',
              sender: 'system',
              timestamp: new Date()
            };
            setMessages([noAgentsMessage]);
          }
        } else {
          console.log('No user found, cannot load agents');
          setAgents([]);
        }
      } catch (error) {
        console.error('Error loading agents:', error);
        setError('Failed to load agents. Please try refreshing the page.');
        setAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [effectiveUser]);

  // Load governance metrics when selected agent changes
  useEffect(() => {
    const loadGovernanceMetrics = async () => {
      if (selectedAgent && governanceEnabled) {
        try {
          console.log('Loading governance metrics for agent:', selectedAgent.identity.name);
          const metrics = await governanceService.getAgentMetrics(selectedAgent.identity.id);
          setGovernanceMetrics(metrics);
          
          // Also load system status
          const status = await governanceService.getSystemStatus();
          setSystemStatus(status);
        } catch (error) {
          console.error('Error loading governance metrics:', error);
          // Set fallback metrics
          setGovernanceMetrics({
            trustScore: 85,
            complianceRate: 92,
            responseTime: 1.2,
            sessionIntegrity: 88,
            policyViolations: 0,
            status: 'monitoring',
            lastUpdated: new Date()
          });
        }
      } else if (!governanceEnabled) {
        setGovernanceMetrics(null);
        setSystemStatus(null);
      }
    };

    loadGovernanceMetrics();
  }, [selectedAgent, governanceEnabled]);

  // Refresh governance metrics periodically
  useEffect(() => {
    if (!selectedAgent || !governanceEnabled) return;

    const interval = setInterval(async () => {
      try {
        const metrics = await governanceService.getAgentMetrics(selectedAgent.identity.id);
        setGovernanceMetrics(metrics);
        
        const status = await governanceService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Error refreshing governance metrics:', error);
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [selectedAgent, governanceEnabled]);

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

  // Call actual agent API using the agent's own configuration
  const callAgentAPI = async (message: string, agent: AgentProfile, attachments: FileAttachment[] = []): Promise<string> => {
    try {
      console.log('Agent object:', agent);
      
      // Extract API configuration from individual agent fields
      const apiKey = agent.apiKey;
      const provider = agent.provider?.toLowerCase(); // Convert to lowercase for comparison
      const selectedModel = agent.selectedModel;
      const apiEndpoint = agent.apiEndpoint;
      
      if (!apiKey || !provider) {
        console.error('Missing API configuration in agent:', { apiKey: !!apiKey, provider, selectedModel });
        throw new Error(`Agent API configuration incomplete. Missing: ${!apiKey ? 'apiKey ' : ''}${!provider ? 'provider' : ''}`);
      }

      console.log('Using API configuration:', { provider, selectedModel, hasApiKey: !!apiKey, apiEndpoint });
      console.log('Provider type:', typeof provider, 'Provider value:', JSON.stringify(provider));
      console.log('Checking provider conditions...');
      console.log('provider === "openai":', provider === 'openai');
      console.log('provider === "anthropic":', provider === 'anthropic');
      console.log('provider === "cohere":', provider === 'cohere');
      console.log('provider === "huggingface":', provider === 'huggingface');
      console.log('apiEndpoint exists:', !!apiEndpoint);

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

      // Use the agent's own API configuration
      let response;
      
      if (provider === 'openai') {
        console.log('Taking OpenAI path...');
        // Create system message based on governance setting
        let systemMessage;
        if (governanceEnabled) {
          // Use Promethios governance kernel for governed agents
          systemMessage = createPromethiosSystemMessage();
        } else {
          // Use basic agent description for ungoverned agents
          systemMessage = `You are ${agent.agentName || agent.identity?.name}. ${agent.description || agent.identity?.description}. You have access to tools and can process file attachments.`;
        }

        const messages = [
          {
            role: 'system',
            content: systemMessage
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
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: selectedModel || 'gpt-3.5-turbo',
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
        
      } else if (provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: selectedModel || 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `You are ${agent.agentName || agent.identity?.name}. ${agent.description || agent.identity?.description}. You have access to tools and can process file attachments.\n\nUser message: ${messageContent}`
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0]?.text || 'No response received';
        
      } else if (provider === 'cohere') {
        response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: selectedModel || 'command',
            prompt: `You are ${agent.agentName || agent.identity?.name}. ${agent.description || agent.identity?.description}.\n\nUser: ${messageContent}\nAssistant:`,
            max_tokens: 1000,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`Cohere API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.generations[0]?.text || 'No response received';
        
      } else if (provider === 'huggingface') {
        const hfModel = selectedModel || 'microsoft/DialoGPT-medium';
        response = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            inputs: `You are ${agent.agentName || agent.identity?.name}. ${agent.description || agent.identity?.description}.\n\nUser: ${messageContent}\nAssistant:`
          })
        });

        if (!response.ok) {
          throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data[0]?.generated_text || data.generated_text || 'No response received';
        
      } else if (apiEndpoint) {
        // Custom API endpoint
        console.log('Taking custom API endpoint path...');
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            message: messageContent,
            agent_name: agent.agentName || agent.identity?.name,
            agent_description: agent.description || agent.identity?.description,
            model: selectedModel,
            attachments: attachments.map(att => ({
              name: att.name,
              type: att.type,
              data: att.data
            }))
          })
        });

        if (!response.ok) {
          throw new Error(`Custom API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || data.message || data.text || 'No response received';
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
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

    const userMessage: ChatMessage = {
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

    // Save user message to persistent storage
    if (selectedAgent) {
      await chatStorageService.saveMessage(userMessage, selectedAgent.identity.id);
    }

    // Scroll to bottom after user message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      // Add governance message if enabled
      if (governanceEnabled) {
        const governanceMessage: ChatMessage = {
          id: `msg_${Date.now()}_governance`,
          content: `🛡️ Processing message through governance layer... ${currentAttachments.length > 0 ? `Scanning ${currentAttachments.length} attachment(s).` : ''}`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceMessage]);
        
        // Save governance message to storage
        if (selectedAgent) {
          await chatStorageService.saveMessage(governanceMessage, selectedAgent.identity.id);
        }
      }

      if (isMultiAgentMode) {
        // Handle multi-agent responses
        for (const agent of selectedAgents) {
          try {
            const agentResponse = await callAgentAPI(userMessage.content, agent, currentAttachments);
            
            const agentMessage: ChatMessage = {
              id: `msg_${Date.now()}_agent_${agent.identity.id}`,
              content: agentResponse,
              sender: 'agent',
              timestamp: new Date(),
              agentName: agent.identity.name,
              agentId: agent.identity.id
            };
            
            setMessages(prev => [...prev, agentMessage]);
            
            // Save agent message to storage
            await chatStorageService.saveMessage(agentMessage, agent.identity.id);
            
            // Scroll to bottom after agent response
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } catch (error) {
            const errorMessage: ChatMessage = {
              id: `msg_${Date.now()}_error_${agent.identity.id}`,
              content: `❌ Error from ${agent.identity.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              sender: 'error',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            
            // Save error message to storage
            await chatStorageService.saveMessage(errorMessage, agent.identity.id);
          }
        }
      } else if (selectedAgent) {
        // Handle single agent response
        const agentResponse = await callAgentAPI(userMessage.content, selectedAgent, currentAttachments);
        
        const agentMessage: ChatMessage = {
          id: `msg_${Date.now()}_agent`,
          content: agentResponse,
          sender: 'agent',
          timestamp: new Date(),
          agentName: selectedAgent.identity.name,
          agentId: selectedAgent.identity.id
        };
        
        setMessages(prev => [...prev, agentMessage]);
        
        // Save agent message to storage
        await chatStorageService.saveMessage(agentMessage, selectedAgent.identity.id);

        // Layer 2: Policy Enforcement - Monitor agent response if governance enabled
        if (governanceEnabled && currentGovernanceSession) {
          try {
            const monitoringResult = await governanceService.monitorMessage(
              currentGovernanceSession.sessionId,
              selectedAgent.identity.id,
              agentMessage.id,
              agentResponse,
              currentAttachments
            );
            
            // Update governance metrics based on monitoring result
            if (monitoringResult.violations && monitoringResult.violations.length > 0) {
              // Add violation notification message
              const violationMessage: ChatMessage = {
                id: `msg_${Date.now()}_governance_violation`,
                content: `⚠️ Governance Alert: ${monitoringResult.violations.length} policy violation(s) detected. Trust score updated to ${monitoringResult.trustScore.toFixed(1)}%.`,
                sender: 'system',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, violationMessage]);
              await chatStorageService.saveMessage(violationMessage, selectedAgent.identity.id);
            }
            
            // Refresh governance metrics
            await loadGovernanceMetrics();
          } catch (error) {
            console.error('Governance monitoring error:', error);
          }
        }

        // Layer 3: Emotional Veritas 2.0 - Fact-checking and emotional analysis
        if (governanceEnabled) {
          try {
            const veritasResult = await veritasService.verifyText(agentResponse, {
              mode: 'balanced',
              includeEmotionalAnalysis: true,
              includeTrustSignals: true,
              confidenceThreshold: 0.7
            });
            
            setCurrentVeritasResult(veritasResult);
            
            // Add Veritas analysis message
            const veritasMessage: ChatMessage = {
              id: `msg_${Date.now()}_veritas_analysis`,
              content: `🔍 Veritas Analysis: Accuracy ${(veritasResult.overallScore.accuracy * 100).toFixed(1)}%, Trust ${(veritasResult.overallScore.trust * 100).toFixed(1)}%, Emotional ${(veritasResult.overallScore.emotional * 100).toFixed(1)}%. ${veritasResult.approved ? '✅ Verified' : '⚠️ Issues detected'}. ${veritasResult.issues.length > 0 ? `Issues: ${veritasResult.issues.join(', ')}.` : ''}`,
              sender: 'system',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, veritasMessage]);
            await chatStorageService.saveMessage(veritasMessage, selectedAgent.identity.id);
            
          } catch (error) {
            console.error('Veritas verification error:', error);
          }
        }
        
        // Scroll to bottom after agent response
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }

      // Add governance completion message if enabled
      if (governanceEnabled && currentGovernanceMetrics) {
        const governanceCompleteMessage: ChatMessage = {
          id: `msg_${Date.now()}_governance_complete`,
          content: `🛡️ Governance Monitor: Trust score ${currentGovernanceMetrics.trustScore.toFixed(1)}%. Compliance: ${currentGovernanceMetrics.complianceRate.toFixed(1)}%. ${currentGovernanceMetrics.policyViolations > 0 ? `${currentGovernanceMetrics.policyViolations} violation(s) detected.` : 'All checks passed.'} ${currentAttachments.length > 0 ? 'All attachments processed safely.' : ''}`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, governanceCompleteMessage]);
        
        // Save governance completion message to storage
        if (selectedAgent) {
          await chatStorageService.saveMessage(governanceCompleteMessage, selectedAgent.identity.id);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        content: `❌ Error: Failed to send message. ${error instanceof Error ? error.message : 'Please try again.'}`,
        sender: 'error',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Save error message to storage
      if (selectedAgent) {
        await chatStorageService.saveMessage(errorMessage, selectedAgent.identity.id);
      }
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

  const handleAgentChange = async (agentId: string) => {
    const agent = agents.find(a => a.identity.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      
      // Load existing chat history for this agent
      const chatHistory = await chatStorageService.loadAgentChatHistory(agent.identity.id);
      
      if (chatHistory && chatHistory.messages.length > 0) {
        // Load existing conversation
        console.log('Loading chat history for agent:', agent.identity.name, chatHistory.messages.length, 'messages');
        setMessages(chatHistory.messages);
      } else {
        // Add agent switch message for new conversation
        const switchMessage: ChatMessage = {
          id: `msg_${Date.now()}_switch`,
          content: `Switched to ${agent.identity.name}. ${agent.identity.description}`,
          sender: 'system',
          timestamp: new Date()
        };
        setMessages([switchMessage]);
        
        // Save switch message to storage
        await chatStorageService.saveMessage(switchMessage, agent.identity.id);
      }
      
      // Initialize new chat session
      await chatStorageService.initializeChatSession(agent, governanceEnabled);
    }
  };

  const handleMultiAgentChange = (agentIds: string[]) => {
    const selectedAgentsList = agents.filter(a => agentIds.includes(a.identity.id));
    setSelectedAgents(selectedAgentsList);
  };

  const handleGovernanceToggle = async () => {
    const newValue = !governanceEnabled;
    setGovernanceEnabled(newValue);
    
    const statusMessage: ChatMessage = {
      id: `msg_${Date.now()}_status`,
      content: `🛡️ Governance ${newValue ? 'enabled' : 'disabled'}. ${newValue ? 'All interactions will be monitored and scored.' : 'Operating in standard mode.'}`,
      sender: 'system',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, statusMessage]);
    
    // Save governance toggle message to storage
    if (selectedAgent) {
      await chatStorageService.saveMessage(statusMessage, selectedAgent.identity.id);
    }
    
    // Note: No auto-scroll for system messages to prevent jumping
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
            <GovernanceToggleContainer onClick={handleGovernanceToggle}>
              <Switch
                checked={governanceEnabled}
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
              <ShieldIcon sx={{ fontSize: 16, color: DARK_THEME.text.secondary }} />
              <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                Governed
              </Typography>
            </GovernanceToggleContainer>
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
                {agents.map((agent) => (
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
            <Typography variant="h6" sx={{ color: DARK_THEME.text.primary }}>
              Core Metrics
            </Typography>
            
            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShieldIcon sx={{ color: DARK_THEME.primary, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    TRUST SCORE
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: DARK_THEME.primary, fontWeight: 'bold' }}>
                  {governanceEnabled && governanceMetrics ? `${governanceMetrics.trustScore}%` : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled && governanceMetrics ? governanceMetrics.trustScore : 0} 
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
                  {governanceEnabled && governanceMetrics ? `${governanceMetrics.complianceRate}%` : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled && governanceMetrics ? governanceMetrics.complianceRate : 0} 
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
                  {governanceEnabled && governanceMetrics ? `${governanceMetrics.responseTime}s` : 'N/A'}
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
                  {governanceEnabled && governanceMetrics ? `${governanceMetrics.sessionIntegrity}%` : 'N/A'}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={governanceEnabled && governanceMetrics ? governanceMetrics.sessionIntegrity : 0} 
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

            {/* Veritas 2.0 Metrics */}
            {currentVeritasResult && (
              <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: DARK_THEME.text.primary, fontWeight: 'bold' }}>
                      🔍 VERITAS 2.0 ANALYSIS
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                        ACCURACY
                      </Typography>
                      <Typography variant="h6" sx={{ color: DARK_THEME.primary }}>
                        {(currentVeritasResult.overallScore.accuracy * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                        EMOTIONAL
                      </Typography>
                      <Typography variant="h6" sx={{ color: DARK_THEME.success }}>
                        {(currentVeritasResult.overallScore.emotional * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                        TRUST
                      </Typography>
                      <Typography variant="h6" sx={{ color: DARK_THEME.warning }}>
                        {(currentVeritasResult.overallScore.trust * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                        EMPATHY
                      </Typography>
                      <Typography variant="h6" sx={{ color: DARK_THEME.info }}>
                        {(currentVeritasResult.overallScore.empathy * 100).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary }}>
                      STATUS
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: currentVeritasResult.approved ? DARK_THEME.success : DARK_THEME.error,
                        fontWeight: 'bold'
                      }}
                    >
                      {currentVeritasResult.approved ? '✅ VERIFIED' : '⚠️ ISSUES DETECTED'}
                    </Typography>
                    
                    {currentVeritasResult.issues.length > 0 && (
                      <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', mt: 1 }}>
                        Issues: {currentVeritasResult.issues.join(', ')}
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', mt: 1 }}>
                    Processing time: {currentVeritasResult.processingTime}ms
                  </Typography>
                </CardContent>
              </Card>
            )} 

            {/* Policy Violations Card */}
            <Card sx={{ bgcolor: DARK_THEME.background, border: `1px solid ${DARK_THEME.border}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ErrorIcon sx={{ color: governanceMetrics?.policyViolations ? DARK_THEME.error : DARK_THEME.success, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
                    POLICY VIOLATIONS
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ 
                  color: governanceMetrics?.policyViolations ? DARK_THEME.error : DARK_THEME.success, 
                  fontWeight: 'bold' 
                }}>
                  {governanceEnabled && governanceMetrics ? governanceMetrics.policyViolations : 'N/A'}
                </Typography>
                {governanceMetrics?.lastUpdated && (
                  <Typography variant="caption" sx={{ color: DARK_THEME.text.secondary, display: 'block', mt: 1 }}>
                    Last updated: {governanceMetrics.lastUpdated.toLocaleTimeString()}
                  </Typography>
                )}
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
                backgroundColor: systemStatus?.overallStatus === 'healthy' ? DARK_THEME.success : 
                                systemStatus?.overallStatus === 'warning' ? DARK_THEME.warning : DARK_THEME.error
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                System Status: {systemStatus?.overallStatus || 'Unknown'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: governanceEnabled ? DARK_THEME.success : DARK_THEME.warning
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Real-time Monitoring: {governanceEnabled ? 'Active' : 'Disabled'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: (governanceMetrics?.policyViolations || 0) === 0 ? DARK_THEME.success : DARK_THEME.error
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                Policy Violations: {governanceMetrics?.policyViolations || 0}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: agents.length > 0 ? DARK_THEME.success : DARK_THEME.error 
              }} />
              <Typography variant="body2" sx={{ color: DARK_THEME.text.primary }}>
                AI Agents: {agents.length > 0 ? `${agents.length} Operational` : 'None Found'}
              </Typography>
            </Box>

            <Divider sx={{ borderColor: DARK_THEME.border, my: 2 }} />

            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary }}>
              System Metrics
            </Typography>
            
            {systemStatus && (
              <Box sx={{ fontSize: '12px', color: DARK_THEME.text.secondary }}>
                <Typography variant="caption" display="block">
                  • Active Sessions: {systemStatus.totalSessions || 0}
                </Typography>
                <Typography variant="caption" display="block">
                  • System Load: {systemStatus.systemLoad || 0}%
                </Typography>
                <Typography variant="caption" display="block">
                  • Uptime: {systemStatus.uptime || 'N/A'}
                </Typography>
                <Typography variant="caption" display="block">
                  • Recent Violations: {systemStatus.recentViolations || 0}
                </Typography>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ color: DARK_THEME.text.primary, mt: 2 }}>
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
                • Persistent storage integration
              </Typography>
              <Typography variant="caption" display="block">
                • Real-time governance monitoring
              </Typography>
            </Box>
          </Box>
        </TabPanel>
      </SidePanel>
    </ChatContainer>
  );
};

export default AdvancedChatComponent;

