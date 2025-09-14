/**
 * Adaptive Chat Container
 * Enhanced chat container that integrates ModernChatProvider and implements
 * adaptive layouts based on participant count and conversation type
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Collapse,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';

// Import modern chat components
import { ModernChatProvider } from '../../../components/modern/ModernChatProvider';
import { AdaptiveMessageRenderer } from '../../../components/modern/AdaptiveMessageRenderer';
import { ChatModeDetector } from '../../../components/modern/ChatModeDetector';

// Import existing components
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GovernancePanel from './GovernancePanel';
import { AgentSelector } from './AgentSelector';

// Import types and services
import { Message as MessageType, ChatMode, Agent, AdHocMultiAgentConfig, MultiAgentSystem } from '../types';
import { messageService } from '../services/MessageService';
import { governanceMonitoringService } from '../services/GovernanceMonitoringService';

interface ChatParticipant {
  id: string;
  name: string;
  type: 'human' | 'ai';
  color?: string;
  isOnline?: boolean;
  avatar?: string;
}

interface AdaptiveChatContainerProps {
  height?: string | number;
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
  sessionId?: string;
}

export const AdaptiveChatContainer: React.FC<AdaptiveChatContainerProps> = ({
  height = '100%',
  agentId,
  multiAgentSystemId,
  governanceEnabled = false,
  sessionId = 'default-session'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for adaptive layout
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [chatMode, setChatMode] = useState<ChatMode>('single-agent');
  
  // Calculate layout based on participants
  const layoutConfig = useMemo(() => {
    const aiAgents = participants.filter(p => p.type === 'ai');
    const humans = participants.filter(p => p.type === 'human');
    
    // Determine chat mode
    let mode: ChatMode = 'single-agent';
    if (humans.length > 1 && aiAgents.length >= 1) {
      mode = 'multi-party';
    } else if (aiAgents.length > 1) {
      mode = 'multi-agent';
    } else if (humans.length > 1) {
      mode = 'multi-human';
    }
    
    // Calculate panel visibility
    const showLeftPanel = aiAgents.length > 1 && !leftPanelCollapsed;
    const showRightPanel = humans.length > 1 && !rightPanelCollapsed;
    
    // Calculate widths
    let chatWidth = '100%';
    let leftWidth = '0%';
    let rightWidth = '0%';
    
    if (showLeftPanel && showRightPanel) {
      // Full multi-party mode
      leftWidth = isMobile ? '20%' : '15%';
      rightWidth = isMobile ? '20%' : '15%';
      chatWidth = isMobile ? '60%' : '70%';
    } else if (showLeftPanel) {
      // Multi-agent mode
      leftWidth = isMobile ? '15%' : '10%';
      chatWidth = isMobile ? '85%' : '90%';
    } else if (showRightPanel) {
      // Multi-human mode
      rightWidth = isMobile ? '15%' : '10%';
      chatWidth = isMobile ? '85%' : '90%';
    }
    
    return {
      mode,
      showLeftPanel,
      showRightPanel,
      leftWidth,
      rightWidth,
      chatWidth,
      aiAgents,
      humans
    };
  }, [participants, leftPanelCollapsed, rightPanelCollapsed, isMobile]);
  
  // Initialize participants based on props
  useEffect(() => {
    const initialParticipants: ChatParticipant[] = [
      {
        id: 'user',
        name: 'You',
        type: 'human',
        color: '#F59E0B',
        isOnline: true
      }
    ];
    
    if (agentId) {
      initialParticipants.push({
        id: agentId,
        name: 'AI Assistant',
        type: 'ai',
        color: '#3B82F6',
        isOnline: true
      });
    }
    
    setParticipants(initialParticipants);
  }, [agentId, multiAgentSystemId]);
  
  // Handle message sending
  const handleMessageSent = useCallback((message: MessageType) => {
    setMessages(prev => [...prev, message]);
  }, []);
  
  // Handle adding participants
  const handleAddAgent = useCallback(() => {
    const newAgent: ChatParticipant = {
      id: `agent-${Date.now()}`,
      name: `Agent ${participants.filter(p => p.type === 'ai').length + 1}`,
      type: 'ai',
      color: ['#06B6D4', '#8B5CF6', '#10B981'][participants.filter(p => p.type === 'ai').length % 3],
      isOnline: true
    };
    setParticipants(prev => [...prev, newAgent]);
  }, [participants]);
  
  const handleInviteHuman = useCallback(() => {
    const newHuman: ChatParticipant = {
      id: `human-${Date.now()}`,
      name: `Guest ${participants.filter(p => p.type === 'human').length}`,
      type: 'human',
      color: ['#EF4444', '#84CC16', '#F97316'][participants.filter(p => p.type === 'human').length % 3],
      isOnline: true
    };
    setParticipants(prev => [...prev, newHuman]);
  }, [participants]);
  
  return (
    <ModernChatProvider
      sessionId={sessionId}
      existingMessages={messages}
      onMessageSent={handleMessageSent}
      enableAnalytics={true}
      debugMode={process.env.NODE_ENV === 'development'}
    >
      <ChatModeDetector
        participants={participants}
        onModeChange={setChatMode}
      >
        <Box
          sx={{
            height,
            display: 'flex',
            backgroundColor: '#1a202c',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Left Panel - AI Agents */}
          <Collapse
            in={layoutConfig.showLeftPanel}
            orientation="horizontal"
            sx={{ height: '100%' }}
          >
            <Paper
              sx={{
                width: layoutConfig.leftWidth,
                height: '100%',
                backgroundColor: '#2d3748',
                borderRadius: 0,
                borderRight: '1px solid #4a5568',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Left Panel Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  AI Agents
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setLeftPanelCollapsed(true)}
                  sx={{ color: '#a0aec0' }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </Box>
              
              {/* Agent List */}
              <Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
                {layoutConfig.aiAgents.map((agent) => (
                  <Box
                    key={agent.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: agent.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white'
                      }}
                    >
                      {agent.name.charAt(0)}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '12px' }}>
                      {agent.name}
                    </Typography>
                  </Box>
                ))}
                
                {/* Add Agent Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddAgent}
                  sx={{
                    width: '100%',
                    mt: 1,
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': {
                      borderColor: '#3182ce',
                      backgroundColor: 'rgba(49, 130, 206, 0.1)'
                    }
                  }}
                >
                  + Add Agent
                </Button>
              </Box>
            </Paper>
          </Collapse>
          
          {/* Collapsed Left Panel Button */}
          {!layoutConfig.showLeftPanel && layoutConfig.aiAgents.length > 1 && (
            <Box
              sx={{
                width: '40px',
                height: '100%',
                backgroundColor: '#2d3748',
                borderRight: '1px solid #4a5568',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2
              }}
            >
              <IconButton
                size="small"
                onClick={() => setLeftPanelCollapsed(false)}
                sx={{ color: '#a0aec0', mb: 1 }}
              >
                <ChevronRightIcon />
              </IconButton>
              <GroupIcon sx={{ color: '#4a5568', fontSize: 20 }} />
            </Box>
          )}
          
          {/* Main Chat Area */}
          <Box
            sx={{
              width: layoutConfig.chatWidth,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1a202c'
            }}
          >
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #4a5568',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ color: '#ffffff' }}>
                  {layoutConfig.mode === 'single-agent' && 'Chat'}
                  {layoutConfig.mode === 'multi-agent' && 'Multi-Agent Chat'}
                  {layoutConfig.mode === 'multi-human' && 'Team Chat'}
                  {layoutConfig.mode === 'multi-party' && 'Collaborative Chat'}
                </Typography>
                <Chip
                  label={`${participants.length} participants`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(49, 130, 206, 0.2)',
                    color: '#3182ce',
                    fontSize: '11px'
                  }}
                />
              </Box>
              
              {governanceEnabled && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={governanceEnabled}
                      size="small"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#10b981'
                        }
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: '#a0aec0' }}>
                      Governance
                    </Typography>
                  }
                />
              )}
            </Box>
            
            {/* Message Area */}
            <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <MessageList
                messages={messages}
                renderMessage={(message) => (
                  <AdaptiveMessageRenderer
                    key={message.id}
                    message={{
                      id: message.id,
                      content: message.content,
                      sender: message.sender,
                      senderName: message.senderName || message.sender,
                      timestamp: new Date(message.timestamp),
                      type: message.type === 'user' ? 'human' : 'ai',
                      metadata: message.metadata
                    }}
                  >
                    {/* Original message component content */}
                    <Box
                      sx={{
                        p: 2,
                        borderLeft: `3px solid ${
                          participants.find(p => p.id === message.sender)?.color || '#4a5568'
                        }`,
                        backgroundColor: message.type === 'user' 
                          ? 'rgba(245, 158, 11, 0.05)' 
                          : 'rgba(59, 130, 246, 0.05)'
                      }}
                    >
                      <Typography variant="body1" sx={{ color: '#ffffff' }}>
                        {message.content}
                      </Typography>
                    </Box>
                  </AdaptiveMessageRenderer>
                )}
              />
            </Box>
            
            {/* Message Input */}
            <Box sx={{ borderTop: '1px solid #4a5568' }}>
              <MessageInput
                onSendMessage={handleMessageSent}
                disabled={false}
                placeholder={`Message ${layoutConfig.mode === 'single-agent' ? 'AI' : 'everyone'}...`}
              />
            </Box>
          </Box>
          
          {/* Right Panel - Human Participants */}
          <Collapse
            in={layoutConfig.showRightPanel}
            orientation="horizontal"
            sx={{ height: '100%' }}
          >
            <Paper
              sx={{
                width: layoutConfig.rightWidth,
                height: '100%',
                backgroundColor: '#2d3748',
                borderRadius: 0,
                borderLeft: '1px solid #4a5568',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Right Panel Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid #4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 600 }}>
                  Participants
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setRightPanelCollapsed(true)}
                  sx={{ color: '#a0aec0' }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              
              {/* Human List */}
              <Box sx={{ flex: 1, p: 1, overflow: 'auto' }}>
                {layoutConfig.humans.map((human) => (
                  <Box
                    key={human.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      mb: 1,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: human.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white'
                      }}
                    >
                      {human.name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: '#ffffff', fontSize: '12px' }}>
                        {human.name}
                      </Typography>
                      {human.isOnline && (
                        <Typography variant="caption" sx={{ color: '#10b981', fontSize: '10px' }}>
                          Online
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
                
                {/* Invite Button */}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleInviteHuman}
                  sx={{
                    width: '100%',
                    mt: 1,
                    borderColor: '#4a5568',
                    color: '#a0aec0',
                    '&:hover': {
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    }
                  }}
                >
                  + Invite
                </Button>
              </Box>
            </Paper>
          </Collapse>
          
          {/* Collapsed Right Panel Button */}
          {!layoutConfig.showRightPanel && layoutConfig.humans.length > 1 && (
            <Box
              sx={{
                width: '40px',
                height: '100%',
                backgroundColor: '#2d3748',
                borderLeft: '1px solid #4a5568',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: 2
              }}
            >
              <IconButton
                size="small"
                onClick={() => setRightPanelCollapsed(false)}
                sx={{ color: '#a0aec0', mb: 1 }}
              >
                <ChevronLeftIcon />
              </IconButton>
              <PersonIcon sx={{ color: '#4a5568', fontSize: 20 }} />
            </Box>
          )}
        </Box>
      </ChatModeDetector>
    </ModernChatProvider>
  );
};

export default AdaptiveChatContainer;

