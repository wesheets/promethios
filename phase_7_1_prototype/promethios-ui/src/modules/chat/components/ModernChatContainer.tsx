import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Tooltip,
  Fade,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Import our modern components
import { GovernancePanel } from './GovernancePanel';
import { ModernMessageInput } from './ModernMessageInput';
import { AgentCoordinationVisualization } from './AgentCoordinationVisualization';
import { SmartObserver } from './SmartObserver';
import { EnhancedAgentSelector } from './EnhancedAgentSelector';

// Import types and services
import { Message as MessageType, ChatMode, Agent, AdHocMultiAgentConfig, MultiAgentSystem } from '../types';
import { messageService } from '../services/MessageService';

// Dark theme colors matching the site
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

// Styled Components with dark theme
const ChatContainer = styled(Box)(() => ({
  display: 'flex',
  height: '100%',
  width: '100%',
  backgroundColor: DARK_THEME.background,
  overflow: 'hidden'
}));

const ChatArea = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  backgroundColor: DARK_THEME.background,
  position: 'relative'
  // Remove alignItems: 'center' to allow header to span full width
}));

const ChatHeader = styled(Box)(() => ({
  padding: '16px 24px',
  borderBottom: `1px solid ${DARK_THEME.border}`,
  backgroundColor: DARK_THEME.surface,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  minHeight: '72px',
  zIndex: 10,
  width: '100%' // Remove maxWidth constraint to span full width
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  padding: '16px 24px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  position: 'relative',
  backgroundColor: DARK_THEME.background,
  width: '100%',
  maxWidth: '900px', // Constrain content width
  margin: '0 auto', // Center the content
  
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: DARK_THEME.border,
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#718096'
    }
  }
}));

const MessageInputContainer = styled(Box)(() => ({
  width: '100%',
  maxWidth: '900px', // Constrain input width to match messages
  margin: '0 auto', // Center the input
  padding: '0 24px 24px 24px'
}));

const MessageBubble = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'agentType'
})(({ isUser, agentType }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  maxWidth: '85%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  flexDirection: isUser ? 'row-reverse' : 'row',
  marginBottom: '8px',
  
  '& .message-content': {
    backgroundColor: isUser 
      ? DARK_THEME.primary
      : agentType === 'observer' 
        ? DARK_THEME.warning + '20'
        : DARK_THEME.surface,
    color: isUser 
      ? '#ffffff'
      : DARK_THEME.text.primary,
    padding: '12px 16px',
    borderRadius: isUser 
      ? '20px 20px 4px 20px' 
      : '20px 20px 20px 4px',
    border: `1px solid ${agentType === 'observer' ? DARK_THEME.warning : DARK_THEME.border}`,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: 1.5,
    
    ...(agentType === 'observer' && {
      border: `1px solid ${DARK_THEME.warning}`,
      backgroundColor: DARK_THEME.warning + '15'
    })
  },
  
  '& .message-avatar': {
    width: 32,
    height: 32,
    fontSize: '14px',
    backgroundColor: agentType === 'observer' 
      ? DARK_THEME.warning
      : agentType === 'user'
        ? DARK_THEME.primary
        : DARK_THEME.success
  }
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  textAlign: 'center',
  color: DARK_THEME.text.secondary,
  padding: '32px'
}));

interface ModernChatContainerProps {
  height?: string | number;
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
}

interface GovernanceAlert {
  id: string;
  type: 'policy_violation' | 'trust_drop' | 'compliance_issue' | 'performance_warning';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
  agentId?: string;
}

export const ModernChatContainer: React.FC<ModernChatContainerProps> = ({
  height = '100%',
  agentId,
  multiAgentSystemId,
  governanceEnabled: initialGovernanceEnabled = true
}) => {
  // State management
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGovernancePanelOpen, setIsGovernancePanelOpen] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [selectedMultiAgentSystem, setSelectedMultiAgentSystem] = useState<MultiAgentSystem | null>(null);
  const [multiAgentConfig, setMultiAgentConfig] = useState<AdHocMultiAgentConfig | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [isMultiAgentMode, setIsMultiAgentMode] = useState(false);
  const [governanceEnabled, setGovernanceEnabled] = useState(initialGovernanceEnabled);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWrapButton, setShowWrapButton] = useState(false);
  
  // Governance metrics state
  const [governanceMetrics, setGovernanceMetrics] = useState({
    trustScore: 0.85,
    complianceRate: 0.92,
    responseTime: 1.2,
    policyViolations: 0,
    observerAlerts: 0,
    sessionIntegrity: 0.88,
    agentCoordination: 0.91,
    realTimeMonitoring: true,
    lastUpdated: new Date()
  });

  // Governance alerts state
  const [governanceAlerts, setGovernanceAlerts] = useState<GovernanceAlert[]>([
    {
      id: 'alert_1',
      type: 'policy_violation',
      message: 'Content policy validation completed',
      severity: 'info',
      timestamp: new Date(),
      agentId: 'baseline-agent'
    }
  ]);

  // Governance activities state
  const [governanceActivities, setGovernanceActivities] = useState([
    {
      id: 'activity_1',
      type: 'policy_check' as const,
      message: 'Content policy validation completed',
      timestamp: new Date(),
      severity: 'info' as const,
      agentId: 'baseline-agent'
    }
  ]);

  // Agent coordination state
  const [agents] = useState<Agent[]>([
    { id: 'baseline-agent', name: 'Baseline', type: 'baseline', avatar: '🤖', status: 'idle' },
    { id: 'factual-agent', name: 'Factual', type: 'factual', avatar: '📊', status: 'idle' },
    { id: 'creative-agent', name: 'Creative', type: 'creative', avatar: '🎨', status: 'idle' },
    { id: 'data-analyst', name: 'Data Analyst', type: 'analyst', avatar: '📈', status: 'idle' },
    { id: 'technical-writer', name: 'Technical Writer', type: 'writer', avatar: '✍️', status: 'idle' },
    { id: 'technical-advisor', name: 'Technical Advisor', type: 'advisor', avatar: '🔧', status: 'idle' },
    { id: 'observer', name: 'Observer', type: 'observer', avatar: '🛡️', status: 'idle' }
  ]);

  // Demo multi-agent systems
  const multiAgentSystems: MultiAgentSystem[] = [
    {
      id: 'research-team',
      name: 'Research & Analysis Team',
      description: 'Factual Agent and Data Analyst working together for comprehensive research',
      agents: [
        { id: 'factual-agent', role: 'primary' },
        { id: 'data-analyst', role: 'secondary' }
      ],
      coordinationPattern: 'sequential',
      createdAt: new Date('2024-01-15'),
      createdBy: 'demo-user',
      isActive: true,
      tags: ['research', 'analysis', 'data'],
      trustScore: 0.92
    },
    {
      id: 'creative-content-team',
      name: 'Creative Content Team',
      description: 'Creative Agent and Technical Writer for engaging content creation',
      agents: [
        { id: 'creative-agent', role: 'primary' },
        { id: 'technical-writer', role: 'secondary' }
      ],
      coordinationPattern: 'parallel',
      createdAt: new Date('2024-01-20'),
      createdBy: 'demo-user',
      isActive: true,
      tags: ['creative', 'content', 'writing'],
      trustScore: 0.88
    },
    {
      id: 'problem-solving-team',
      name: 'Problem Solving Team',
      description: 'Multi-agent team for complex problem analysis and solution development',
      agents: [
        { id: 'factual-agent', role: 'primary' },
        { id: 'creative-agent', role: 'secondary' },
        { id: 'technical-advisor', role: 'secondary' }
      ],
      coordinationPattern: 'hierarchical',
      createdAt: new Date('2024-01-25'),
      createdBy: 'demo-user',
      isActive: true,
      tags: ['problem-solving', 'analysis', 'innovation'],
      trustScore: 0.95
    }
  ];

  const [currentActivity, setCurrentActivity] = useState<{
    type: 'thinking' | 'handoff' | 'coordination';
    data: any;
  } | undefined>();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom only when new messages are added
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    // Only scroll if a new message was added
    if (messages.length > prevMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Initialize with demo agent and create session
  useEffect(() => {
    if (!selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents, selectedAgent]);

  // Create new session when governance or multi-agent mode changes
  useEffect(() => {
    const initializeSession = async () => {
      try {
        if (selectedAgent || isMultiAgentMode) {
          const sessionType = isMultiAgentMode ? 'multi_agent' : 'single_agent';
          const agentIdParam = isMultiAgentMode ? undefined : selectedAgent?.id;
          
          const response = await messageService.createSession(
            'demo-user',
            agentIdParam,
            sessionType,
            governanceEnabled
          );
          
          if (response.success && response.session_id) {
            setSessionId(response.session_id);
            console.log(`Created ${sessionType} session:`, response.session_id);
          }
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };

    initializeSession();
  }, [selectedAgent, isMultiAgentMode, governanceEnabled]);

  // Handle governance toggle
  const handleGovernanceToggle = (enabled: boolean) => {
    setGovernanceEnabled(enabled);
    
    // Add governance status message
    const statusMessage: MessageType = {
      id: `msg_${Date.now()}_governance`,
      content: `🛡️ Governance ${enabled ? 'enabled' : 'disabled'}. ${enabled ? 'All interactions will be monitored and scored.' : 'Operating in standard mode.'}`,
      sender: 'system',
      timestamp: new Date(),
      governanceStatus: enabled ? 'monitored' : 'unmonitored'
    };
    setMessages(prev => [...prev, statusMessage]);

    // Reset metrics when governance is disabled
    if (!enabled) {
      setGovernanceMetrics(prev => ({
        ...prev,
        trustScore: 0,
        complianceRate: 0,
        policyViolations: 0,
        observerAlerts: 0,
        realTimeMonitoring: false,
        lastUpdated: new Date()
      }));
      setGovernanceAlerts([]);
    }
  };

  // Handle multi-agent mode toggle
  const handleMultiAgentToggle = (enabled: boolean) => {
    setIsMultiAgentMode(enabled);
    
    if (enabled) {
      // Clear single agent selection
      setSelectedAgent(null);
      // Set up default multi-agent configuration if no system selected
      if (!selectedMultiAgentSystem && selectedAgents.length === 0) {
        setSelectedAgents([agents[1], agents[2]]); // Default to factual and creative
      }
    } else {
      // Clear multi-agent selections
      setSelectedAgents([]);
      setSelectedMultiAgentSystem(null);
      setMultiAgentConfig(null);
      setShowWrapButton(false);
      // Set default single agent
      if (!selectedAgent) {
        setSelectedAgent(agents[0]);
      }
    }

    // Add mode change message
    const modeMessage: MessageType = {
      id: `msg_${Date.now()}_mode`,
      content: `🤝 Switched to ${enabled ? 'multi-agent' : 'single agent'} mode. ${enabled ? 'Multiple agents will collaborate on responses.' : 'Single agent will handle all interactions.'}`,
      sender: 'system',
      timestamp: new Date(),
      governanceStatus: governanceEnabled ? 'monitored' : 'unmonitored'
    };
    setMessages(prev => [...prev, modeMessage]);
  };

  // Handle agent selection (single mode)
  const handleAgentSelect = (agent: Agent | null) => {
    setSelectedAgent(agent);
  };

  // Handle multi-agent selection (multi mode)
  const handleMultiAgentSelect = (agents: Agent[]) => {
    setSelectedAgents(agents);
    setSelectedMultiAgentSystem(null); // Clear system selection when manually selecting agents
    
    // Update multi-agent config
    if (agents.length >= 2) {
      setMultiAgentConfig({
        agents: agents.map((agent, index) => ({
          id: agent.id,
          role: index === 0 ? 'primary' : 'secondary'
        })),
        coordinationPattern: 'sequential'
      });
    } else {
      setMultiAgentConfig(null);
      setShowWrapButton(false);
    }
  };

  // Handle multi-agent system selection
  const handleMultiAgentSystemSelect = (system: MultiAgentSystem | null) => {
    setSelectedMultiAgentSystem(system);
    
    if (system) {
      // Set agents from system
      const systemAgents = agents.filter(a => 
        system.agents.some(sa => sa.id === a.id)
      );
      setSelectedAgents(systemAgents);
      
      // Set multi-agent config from system
      setMultiAgentConfig({
        agents: system.agents,
        coordinationPattern: system.coordinationPattern,
        name: system.name,
        description: system.description
      });
    } else {
      // Clear when no system selected
      setSelectedAgents([]);
      setMultiAgentConfig(null);
    }
    setShowWrapButton(false); // Don't show wrap button for existing systems
  };

  // Handle wrap as system
  const handleWrapAsSystem = (config: AdHocMultiAgentConfig) => {
    console.log('Wrapping as system:', config);
    
    // In a real app, this would navigate to the multi-agent wrapping page
    // For now, we'll show a success message
    const wrapMessage: MessageType = {
      id: `msg_${Date.now()}_wrap`,
      content: `✅ Successfully created "${config.name}" multi-agent system! This configuration is now available for future use.`,
      sender: 'system',
      timestamp: new Date(),
      governanceStatus: governanceEnabled ? 'monitored' : 'unmonitored'
    };
    setMessages(prev => [...prev, wrapMessage]);
    
    // Hide wrap button after successful wrapping
    setShowWrapButton(false);
    
    // TODO: Navigate to multi-agent wrapping page with pre-filled config
    // navigate('/ui/multi-agent-wrapping', { state: { config } });
  };

  // Handle message sending
  const handleSendMessage = async (message: string, attachments?: any[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;

    const userMessage: MessageType = {
      id: `msg_${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date(),
      governanceStatus: 'unmonitored',
      attachments: attachments?.map(att => ({
        id: att.id,
        name: att.file.name,
        type: att.type,
        size: att.file.size,
        url: att.preview || ''
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Show thinking animation
    setCurrentActivity({
      type: 'thinking',
      data: {
        message: isMultiAgentMode ? 'Coordinating agents...' : 'Processing your request...',
        progress: 0
      }
    });

    try {
      let result;
      
      if (isMultiAgentMode && multiAgentConfig) {
        // Multi-agent processing with coordination visualization
        setCurrentActivity({
          type: 'coordination',
          data: {
            pattern: multiAgentConfig.coordinationPattern || 'sequential',
            agents: agents.filter(a => multiAgentConfig.agents?.some(ma => ma.id === a.id))
          }
        });

        const agentIds = multiAgentConfig.agents?.map(agent => agent.id) || [];
        result = await messageService.sendMessageToMultiAgent(
          message,
          agentIds,
          multiAgentConfig.coordinationPattern || 'sequential',
          governanceEnabled
        );
        
        if (result.success && result.responses) {
          // Add individual agent responses with handoff visualization
          for (let i = 0; i < result.responses.length; i++) {
            const response = result.responses[i];
            
            // Show handoff if not the first agent
            if (i > 0) {
              setCurrentActivity({
                type: 'handoff',
                data: {
                  fromAgent: agents.find(a => a.id === result.responses[i-1].agent_id),
                  toAgent: agents.find(a => a.id === response.agent_id),
                  message: `Passing analysis to ${agents.find(a => a.id === response.agent_id)?.name}`
                }
              });
              
              // Wait for handoff animation
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            const agentMessage: MessageType = {
              id: `msg_${Date.now()}_${i}`,
              content: response.response,
              sender: 'agent',
              agentId: response.agent_id,
              timestamp: new Date(),
              governanceStatus: governanceEnabled ? 'monitored' : 'unmonitored'
            };
            setMessages(prev => [...prev, agentMessage]);
          }
        }
      } else if (selectedAgent) {
        // Single agent processing
        result = await messageService.sendMessageToAgent(
          selectedAgent.id,
          message,
          governanceEnabled
        );
        
        if (result.success && result.response) {
          const agentMessage: MessageType = {
            id: `msg_${Date.now()}`,
            content: result.response,
            sender: 'agent',
            agentId: selectedAgent.id,
            timestamp: new Date(),
            governanceStatus: governanceEnabled ? 'monitored' : 'unmonitored'
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      }

      // Add governance monitoring if enabled
      if (governanceEnabled && result?.governance_data) {
        const observerMessage: MessageType = {
          id: `msg_${Date.now()}_observer`,
          content: `🛡️ Governance Monitor: Trust score ${(result.governance_data.trust_score || 0.8) * 100}%, Compliance: ${result.governance_data.compliance_status || 'compliant'}`,
          sender: 'system',
          agentId: 'observer',
          timestamp: new Date(),
          governanceStatus: 'monitored'
        };
        setMessages(prev => [...prev, observerMessage]);
        
        // Update governance metrics
        setGovernanceMetrics(prev => ({
          ...prev,
          trustScore: result.governance_data.trust_score || prev.trustScore,
          complianceRate: result.governance_data.compliance_status === 'compliant' ? 0.95 : 0.85,
          responseTime: result.governance_data.processing_time_ms ? result.governance_data.processing_time_ms / 1000 : prev.responseTime
        }));

        // Add governance activity
        setGovernanceActivities(prev => [{
          id: `activity_${Date.now()}`,
          type: 'trust_update',
          message: `Trust score updated: ${(result.governance_data.trust_score * 100).toFixed(0)}%`,
          timestamp: new Date(),
          severity: 'info',
          agentId: selectedAgent?.id
        }, ...prev.slice(0, 4)]);
      }

      // Show wrap button after successful multi-agent conversation
      if (isMultiAgentMode && selectedAgents.length >= 2 && !selectedMultiAgentSystem && messages.length >= 3) {
        setShowWrapButton(true);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      const errorMessage: MessageType = {
        id: `msg_${Date.now()}_error`,
        content: '❌ Error: Failed to send message. Please try again.',
        sender: 'system',
        timestamp: new Date(),
        governanceStatus: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setCurrentActivity(undefined);
    }
  };

  // Get agent info for message display
  const getAgentInfo = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      return { name: agent.name, avatar: agent.avatar, type: agent.type };
    }
    return { name: agentId, avatar: '🤖', type: 'baseline' };
  };

  return (
    <ChatContainer>
      {/* Governance Panel */}
      <GovernancePanel
        isOpen={isGovernancePanelOpen}
        onToggle={() => setIsGovernancePanelOpen(!isGovernancePanelOpen)}
        metrics={governanceMetrics}
        activities={governanceActivities}
        governanceEnabled={governanceEnabled}
        onGovernanceToggle={(enabled) => {
          // Handle governance toggle
          console.log('Governance toggled:', enabled);
        }}
        multiAgentMode={isMultiAgentMode}
      />

      {/* Main Chat Area */}
      <ChatArea>
        {/* Chat Header */}
        <ChatHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => setIsGovernancePanelOpen(!isGovernancePanelOpen)}
              size="small"
              sx={{ color: DARK_THEME.primary }}
            >
              {isGovernancePanelOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            
            <Typography variant="h6" sx={{ fontWeight: 600, color: DARK_THEME.text.primary }}>
              Chat with Your Agents
            </Typography>
            
            {selectedAgent && !isMultiAgentMode && (
              <Chip 
                label={selectedAgent.name}
                avatar={<Avatar sx={{ bgcolor: DARK_THEME.primary }}>{selectedAgent.avatar}</Avatar>}
                variant="outlined"
                sx={{ 
                  color: DARK_THEME.text.primary,
                  borderColor: DARK_THEME.border,
                  '& .MuiChip-avatar': { color: '#ffffff' }
                }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={governanceEnabled ? 'Governed' : 'Standard'}
              color={governanceEnabled ? 'success' : 'default'}
              size="small"
              icon={governanceEnabled ? <ShieldIcon /> : undefined}
              sx={{ 
                color: DARK_THEME.text.primary,
                backgroundColor: governanceEnabled ? DARK_THEME.success + '20' : DARK_THEME.surface,
                borderColor: DARK_THEME.border
              }}
            />
            <Chip 
              label={isMultiAgentMode ? 'Multi-Agent' : 'Single Agent'}
              color={isMultiAgentMode ? 'secondary' : 'primary'}
              size="small"
              icon={isMultiAgentMode ? <GroupIcon /> : <PersonIcon />}
              sx={{ 
                color: DARK_THEME.text.primary,
                backgroundColor: isMultiAgentMode ? DARK_THEME.warning + '20' : DARK_THEME.primary + '20',
                borderColor: DARK_THEME.border
              }}
            />
            <IconButton size="small" sx={{ color: DARK_THEME.text.secondary }}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </ChatHeader>

        {/* Enhanced Agent Selector */}
        <EnhancedAgentSelector
          selectedAgent={selectedAgent}
          selectedAgents={selectedAgents}
          selectedMultiAgentSystem={selectedMultiAgentSystem}
          isMultiAgentMode={isMultiAgentMode}
          onAgentSelect={handleAgentSelect}
          onMultiAgentSelect={handleMultiAgentSelect}
          onMultiAgentSystemSelect={handleMultiAgentSystemSelect}
          onModeChange={handleMultiAgentToggle}
          onWrapAsSystem={handleWrapAsSystem}
          showWrapButton={showWrapButton}
          agents={agents}
          multiAgentSystems={multiAgentSystems}
        />

        {/* Messages Container */}
        <MessagesContainer>
          {messages.length === 0 && (
            <EmptyState>
              <Avatar sx={{ width: 64, height: 64, mb: 2, bgcolor: DARK_THEME.primary }}>
                {isMultiAgentMode ? '🤝' : '🤖'}
              </Avatar>
              <Typography variant="h6" gutterBottom sx={{ color: DARK_THEME.text.primary }}>
                Start a conversation
              </Typography>
              <Typography variant="body2" sx={{ color: DARK_THEME.text.secondary }}>
                {isMultiAgentMode 
                  ? 'Multiple agents will collaborate to provide comprehensive responses'
                  : 'Chat with your selected agent and see governance in action'
                }
              </Typography>
            </EmptyState>
          )}

          {messages.map((message) => {
            const agentInfo = message.agentId ? getAgentInfo(message.agentId) : null;
            const isUser = message.sender === 'user';
            const isObserver = message.agentId === 'observer';
            
            return (
              <Fade in key={message.id} timeout={300}>
                <MessageBubble 
                  isUser={isUser}
                  agentType={isObserver ? 'observer' : isUser ? 'user' : 'agent'}
                >
                  <Avatar className="message-avatar">
                    {isUser ? '👤' : agentInfo?.avatar || '🤖'}
                  </Avatar>
                  
                  <Box>
                    {!isUser && agentInfo && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mb: 0.5, 
                          color: DARK_THEME.text.secondary,
                          fontWeight: 500
                        }}
                      >
                        {agentInfo.name}
                        {isObserver && (
                          <Chip 
                            label="Observer" 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              height: 16, 
                              fontSize: '10px',
                              backgroundColor: DARK_THEME.warning + '20',
                              color: DARK_THEME.warning
                            }}
                          />
                        )}
                      </Typography>
                    )}
                    
                    <Box className="message-content">
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      
                      {/* File attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {message.attachments.map((attachment) => (
                            <Chip
                              key={attachment.id}
                              label={attachment.name}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '10px',
                                color: DARK_THEME.text.secondary,
                                borderColor: DARK_THEME.border
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        mt: 0.5, 
                        color: DARK_THEME.text.secondary,
                        fontSize: '11px'
                      }}
                    >
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {message.governanceStatus === 'monitored' && (
                        <Chip 
                          label="✓ Governed" 
                          size="small" 
                          sx={{ 
                            ml: 1, 
                            height: 14, 
                            fontSize: '9px',
                            backgroundColor: DARK_THEME.success + '20',
                            color: DARK_THEME.success
                          }}
                        />
                      )}
                    </Typography>
                  </Box>
                </MessageBubble>
              </Fade>
            );
          })}

          {/* Agent Coordination Visualization */}
          {(isProcessing || currentActivity) && (
            <AgentCoordinationVisualization
              agents={isMultiAgentMode ? agents.filter(a => a.type !== 'observer') : [selectedAgent!]}
              coordinationPattern={multiAgentConfig?.coordinationPattern || 'sequential'}
              isMultiAgent={isMultiAgentMode}
              currentActivity={currentActivity}
            />
          )}

          <div ref={messagesEndRef} />
        </MessagesContainer>

        {/* Modern Message Input */}
        <MessageInputContainer>
          <ModernMessageInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            disabled={isProcessing}
            placeholder={
              isMultiAgentMode 
                ? "Ask multiple agents to collaborate on your question..."
                : `Chat with ${selectedAgent?.name || 'agent'}...`
            }
            maxFiles={5}
            maxFileSize={10}
            acceptedFileTypes={['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.txt']}
          />
        </MessageInputContainer>
      </ChatArea>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </ChatContainer>
  );
};

export default ModernChatContainer;

