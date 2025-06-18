import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Button
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Message as MessageType, ChatMode, Agent, AdHocMultiAgentConfig, MultiAgentSystem } from '../types';
import { messageService } from '../services/MessageService';
import { governanceMonitoringService } from '../services/GovernanceMonitoringService';
import { FileUploadResult } from '../services/FileUploadService';
import { adHocMultiAgentService, MultiAgentConversation } from '../services/AdHocMultiAgentService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import GovernancePanel from './GovernancePanel';
import { AgentSelector } from './AgentSelector';
import AtlasChatIntegration from '../../../components/atlas/chat/AtlasChatIntegration';
import ConversationWrappingPrompt from '../../../modules/agent-wrapping/components/ConversationWrappingPrompt';
import { useNavigate } from 'react-router-dom';

interface ChatSession {
  id: string;
  name: string;
  mode: string;
  lastActivity: string;
}

interface ChatContainerProps {
  height?: string | number;
  agentId?: string;
  multiAgentSystemId?: string;
  governanceEnabled?: boolean;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  height = 'calc(100vh - 60px)', // Default to account for navigation
  agentId,
  multiAgentSystemId,
  governanceEnabled: initialGovernanceEnabled = false
}) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isGovernanceEnabled, setIsGovernanceEnabled] = useState(initialGovernanceEnabled);
  const [isMultiAgentEnabled, setIsMultiAgentEnabled] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [multiAgentConfig, setMultiAgentConfig] = useState<AdHocMultiAgentConfig | null>(null);
  const [selectedMultiAgentSystem, setSelectedMultiAgentSystem] = useState<MultiAgentSystem | null>(null);
  const [multiAgentConversations, setMultiAgentConversations] = useState<MultiAgentConversation[]>([]);
  const [showWrappingPrompt, setShowWrappingPrompt] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    { id: 'new', name: 'New Chat', mode: 'standard mode', lastActivity: 'now' },
    { id: '1', name: 'Chat Session 1', mode: 'standard mode', lastActivity: '2 hours ago' },
    { id: '2', name: 'Chat Session 2', mode: 'governance mode', lastActivity: '2 hours ago' },
    { id: '3', name: 'Chat Session 3', mode: 'multi-agent mode', lastActivity: '2 hours ago' }
  ]);
  const [selectedSession, setSelectedSession] = useState<string>('new');
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  // Initialize with agent if provided
  useEffect(() => {
    if (agentId) {
      const agent: Agent = {
        id: agentId,
        name: agentId,
        description: `Agent ${agentId}`,
        capabilities: []
      };
      setSelectedAgent(agent);
    }
  }, [agentId]);

  // Initialize with multi-agent system if provided
  useEffect(() => {
    if (multiAgentSystemId) {
      // In a real app, you'd fetch the multi-agent system details here
      const system: MultiAgentSystem = {
        id: multiAgentSystemId,
        name: multiAgentSystemId,
        agents: [], // Populate with actual agents
        coordinationPattern: 'sequential' // Example
      };
      setSelectedMultiAgentSystem(system);
      setIsMultiAgentEnabled(true); // Automatically enable multi-agent mode for pre-wrapped systems
    }
  }, [multiAgentSystemId]);

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    // Add user message
    const userMessage = messageService.addMessage({
      content,
      sender: 'user'
    });

    // Handle attachments if present
    if (attachments && attachments.length > 0) {
      const attachmentInfo = attachments.map(att => {
        if (att.type === 'image') {
          return `📷 ${att.name}`;
        }
        return `📎 ${att.name}`;
      }).join(', ');
      
      const attachmentMessage = messageService.addMessage({
        content: `Attachments: ${attachmentInfo}`,
        sender: 'system'
      });
    }

    // Show thinking indicator
    const thinkingMessage = messageService.addMessage({
      content: '🤔 **Agent is thinking...**',
      sender: 'system',
      isThinking: true
    });
    setMessages(messageService.getMessages());

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Remove thinking indicator
    messageService.removeMessage(thinkingMessage.id);

    // Handle different modes
    if (isMultiAgentEnabled && (selectedAgent || multiAgentConfig || selectedMultiAgentSystem)) {
      await handleMultiAgentMessage(content);
    } else {
      await handleStandardMessage(content);
    }

    // Update state with all messages
    setMessages(messageService.getMessages());
  };

  const handleStandardMessage = async (content: string) => {
    // Simulate governance analysis if enabled
    let governanceStatus = 'compliant';
    if (isGovernanceEnabled) {
      governanceStatus = Math.random() > 0.8 ? 'warning' : 'compliant';
      
      // If governance violation detected, Observer agent jumps in
      if (governanceStatus === 'warning') {
        const observerMessage = messageService.addMessage({
          content: `🛡️ **Promethios Observer**: I've detected a potential governance concern in this conversation. The response may not fully comply with established guidelines. Please review and consider alternative approaches.`,
          sender: 'agent',
          agentId: 'promethios-observer',
          governanceStatus: 'warning'
        });
        
        // Update governance metrics
        governanceMonitoringService.addAlert({
          type: 'warning',
          message: `Potential compliance concern detected`,
          agentId: 'promethios-observer'
        });
      }
    }
    
    // Add main agent response
    const botMessage = messageService.addMessage({
      content: `Echo: ${content}`,
      sender: 'agent',
      governanceStatus
    });
  };

  const handleMultiAgentMessage = async (content: string) => {
    if (selectedMultiAgentSystem) {
      // Use pre-wrapped multi-agent system
      await handleWrappedSystemMessage(content, selectedMultiAgentSystem);
    } else if (selectedAgent) {
      // Single agent response with governance monitoring
      await handleSingleAgentMessage(content, selectedAgent);
    } else if (multiAgentConfig) {
      // Ad hoc multi-agent conversation
      await handleAdHocMultiAgentMessage(content, multiAgentConfig);
    }
  };

  const handleWrappedSystemMessage = async (content: string, system: MultiAgentSystem) => {
    // Simulate wrapped system response
    const systemAgents = system.agents;
    
    // Add system coordination message
    const coordinationMessage = messageService.addMessage({
      content: `🔗 **${system.name}** is coordinating a response using ${system.coordinationPattern} pattern...`,
      sender: 'system'
    });

    // Process each agent in the system
    systemAgents.forEach((agent, index) => {
      setTimeout(() => {
        let governanceStatus = 'compliant';
        
        // Check governance if enabled
        if (isGovernanceEnabled && Math.random() > 0.8) {
          governanceStatus = 'warning';
          
          // Observer intervention
          setTimeout(() => {
            const observerMessage = messageService.addMessage({
              content: `🛡️ **Promethios Observer**: Governance concern detected in ${system.name} - ${agent.name}'s response. Multi-agent system coordination requires compliance monitoring.`,
              sender: 'agent',
              agentId: 'promethios-observer',
              governanceStatus: 'warning'
            });
            setMessages(messageService.getMessages());
          }, 500);
        }
        
        const role = system.roles?.[agent.id] || 'general';
        const agentMessage = messageService.addMessage({
          content: `**${agent.name}**: As part of ${system.name}, I'll address this from my ${role} perspective: ${content} - This requires coordinated analysis with my team members.`,
          sender: 'agent',
          agentId: agent.id,
          governanceStatus
        });
        setMessages(messageService.getMessages());
      }, index * (system.coordinationPattern === 'sequential' ? 1500 : 500));
    });
  };

  const handleSingleAgentMessage = async (content: string, agent: Agent) => {
    let governanceStatus = 'compliant';
    
    // Check governance if enabled
    if (isGovernanceEnabled && Math.random() > 0.7) {
      governanceStatus = 'warning';
      
      // Observer agent intervention
      const observerMessage = messageService.addMessage({
        content: `🛡️ **Promethios Observer**: I'm monitoring this conversation with ${agent.name}. I've identified some governance considerations that should be addressed.`,
        sender: 'agent',
        agentId: 'promethios-observer',
        governanceStatus: 'warning'
      });
    }
    
    const agentMessage = messageService.addMessage({
      content: `**${agent.name}**: Based on my expertise in ${agent.description.toLowerCase()}, I would say: ${content} - this is an interesting perspective that requires careful consideration.`,
      sender: 'agent',
      agentId: agent.id,
      governanceStatus
    });
  };

  const handleAdHocMultiAgentMessage = async (content: string, config: AdHocMultiAgentConfig) => {
    try {
      const conversation = await adHocMultiAgentService.startMultiAgentConversation(
        content,
        config
      );

      // Add each agent response with governance monitoring
      conversation.responses.forEach((response, index) => {
        setTimeout(() => {
          let governanceStatus = 'compliant';
          
          // Random governance check for each agent if enabled
          if (isGovernanceEnabled && Math.random() > 0.8) {
            governanceStatus = 'warning';
            
            // Observer intervention after problematic response
            setTimeout(() => {
              const observerMessage = messageService.addMessage({
                content: `🛡️ **Promethios Observer**: I've detected governance concerns in ${response.agentName}'s response. Ad hoc multi-agent conversations require careful coordination to maintain compliance.`,
                sender: 'agent',
                agentId: 'promethios-observer',
                governanceStatus: 'warning'
              });
              setMessages(messageService.getMessages());
            }, 500);
          }
          
          const role = config.roles?.[response.agentId] || 'general';
          const agentMessage = messageService.addMessage({
            content: `**${response.agentName}**: ${response.content}`,
            sender: 'agent',
            agentId: response.agentId,
            governanceStatus
          });
          setMessages(messageService.getMessages());
          
          // Store conversation and check for wrapping opportunity
          if (index === conversation.responses.length - 1) {
            setMultiAgentConversations(prev => [...prev, conversation]);
            
            if (conversation.status === 'completed' && conversation.responses.length >= 2) {
              setTimeout(() => {
                setShowWrappingPrompt(conversation.id);
              }, 2000);
            }
          }
        }, index * (config.coordinationPattern === 'sequential' ? 1000 : 300));
      });
    } catch (error) {
      const errorMessage = messageService.addMessage({
        content: 'Error: Failed to coordinate multi-agent response. Please try again.',
        sender: 'system'
      });
    }
  };

  const handleSessionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSessionMenuAnchor(event.currentTarget);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
    handleSessionMenuClose();
  };

  const getCurrentSessionName = () => {
    if (agentId) return `Chat with Agent: ${agentId}`;
    if (multiAgentSystemId) return `Chat with Multi-Agent System: ${multiAgentSystemId}`;
    const session = chatSessions.find(s => s.id === selectedSession);
    return session ? session.name : 'New Chat';
  };

  const getModeChips = () => {
    const chips = [];
    if (isGovernanceEnabled) {
      chips.push(
        <Chip
          key="governance"
          icon={<SecurityIcon />}
          label="Governance"
          size="small"
          color="error"
          variant="outlined"
        />
      );
    }
    // Only show Multi-Agent chip if it's not a pre-wrapped system
    if (isMultiAgentEnabled && !multiAgentSystemId) {
      chips.push(
        <Chip
          key="multi-agent"
          icon={<GroupIcon />}
          label="Multi-Agent"
          size="small"
          color="success"
          variant="outlined"
        />
      );
    }
    return chips;
  };

  return (
    <Box sx={{ 
      height, 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: 'white'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Session Selector / Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(agentId || multiAgentSystemId) && (
            <IconButton onClick={() => navigate('/ui/agent-profiles')} sx={{ color: 'white' }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          {!agentId && !multiAgentSystemId && (
            <>
              <Button
                onClick={handleSessionMenuOpen}
                endIcon={<ExpandMoreIcon />}
                sx={{ 
                  color: 'white',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500
                }}
              >
                {getCurrentSessionName()}
              </Button>
              <Menu
                anchorEl={sessionMenuAnchor}
                open={Boolean(sessionMenuAnchor)}
                onClose={handleSessionMenuClose}
                PaperProps={{
                  sx: { backgroundColor: '#2a2a2a', color: 'white' }
                }}
              >
                {chatSessions.map((session) => (
                  <MenuItem
                    key={session.id}
                    onClick={() => handleSessionSelect(session.id)}
                    selected={selectedSession === session.id}
                  >
                    <Box>
                      <Typography variant="body1">{session.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {session.mode} • {session.lastActivity}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                <MenuItem onClick={handleSessionMenuClose}>
                  <AddIcon sx={{ mr: 1 }} />
                  New Chat
                </MenuItem>
              </Menu>
            </>
          )}
          {(agentId || multiAgentSystemId) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ color: 'white' }}>
                {getCurrentSessionName()}
              </Typography>
              {getModeChips()}
            </Box>
          )}
        </Box>

        {/* Right-aligned controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isGovernanceEnabled}
                onChange={(e) => setIsGovernanceEnabled(e.target.checked)}
                name="governanceSwitch"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#FFC107',
                    '+ .MuiSwitch-track': { backgroundColor: '#FFC107' }
                  }
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'white' }}>
                Governance
              </Typography>
            }
            labelPlacement="start"
          />

          {!agentId && !multiAgentSystemId && (
            <FormControlLabel
              control={
                <Switch
                  checked={isMultiAgentEnabled}
                  onChange={(e) => setIsMultiAgentEnabled(e.target.checked)}
                  name="multiAgentSwitch"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#4CAF50',
                      '+ .MuiSwitch-track': { backgroundColor: '#4CAF50' }
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: 'white' }}>
                  Multi-Agent
                </Typography>
              }
              labelPlacement="start"
            />
          )}

          <IconButton sx={{ color: 'white' }}>
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Agent Selector (only visible if multi-agent mode is enabled and not a pre-wrapped system) */}
      {isMultiAgentEnabled && !multiAgentSystemId && (
        <AgentSelector
          mode="multi-agent"
          onAgentSelected={setSelectedAgent}
          onMultiAgentConfigured={setMultiAgentConfig}
          onMultiAgentSystemSelected={setSelectedMultiAgentSystem}
        />
      )}

      {/* Message List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <MessageList messages={messages} />
      </Box>

      {/* Governance Panel */}
      {isGovernanceEnabled && (
        <GovernancePanel />
      )}

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <MessageInput onSendMessage={handleSendMessage} />
      </Box>

      {/* Atlas Chat Integration */}
      <AtlasChatIntegration />

      {/* Conversation Wrapping Prompt */}
      {showWrappingPrompt && (
        <ConversationWrappingPrompt
          conversationId={showWrappingPrompt}
          onClose={() => setShowWrappingPrompt(null)}
          onWrapSuccess={() => setShowWrappingPrompt(null)} // Close after successful wrap
        />
      )}
    </Box>
  );
};


