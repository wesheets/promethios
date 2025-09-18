/**
 * AgentCommandCenterWorkspace - Full-featured agent command center within collaboration workspace
 * Integrates existing agent functionality with collaboration interface
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Chip,
  Avatar,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Insights as InsightsIcon,
  Code as CodeIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  MoreVert as MoreIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  History as HistoryIcon
} from '@mui/icons-material';

import { CollaborationItem } from '../../pages/CollaborationsPage';
import CollaborationMessaging from './CollaborationMessaging';

// Agent capabilities and specializations
interface AgentCapability {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  active: boolean;
}

interface AgentCommandCenterWorkspaceProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  position?: 'primary' | 'secondary';
}

const AgentCommandCenterWorkspace: React.FC<AgentCommandCenterWorkspaceProps> = ({
  agentId,
  agentName,
  onClose,
  position = 'primary'
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [agentStatus, setAgentStatus] = useState<'online' | 'busy' | 'offline'>('online');
  const [activeCapabilities, setActiveCapabilities] = useState<string[]>([]);

  // Sample agent capabilities based on agent type
  const getAgentCapabilities = (): AgentCapability[] => {
    const baseCapabilities = [
      {
        id: 'analysis',
        name: 'Data Analysis',
        icon: <InsightsIcon fontSize="small" />,
        description: 'Analyze data and provide insights',
        active: true
      },
      {
        id: 'writing',
        name: 'Content Writing',
        icon: <DocumentIcon fontSize="small" />,
        description: 'Generate and edit written content',
        active: true
      },
      {
        id: 'coding',
        name: 'Code Generation',
        icon: <CodeIcon fontSize="small" />,
        description: 'Write and debug code',
        active: false
      },
      {
        id: 'creative',
        name: 'Creative Tasks',
        icon: <AutoAwesomeIcon fontSize="small" />,
        description: 'Creative problem solving and ideation',
        active: true
      }
    ];

    // Customize based on agent name/type
    if (agentName.toLowerCase().includes('analyst')) {
      baseCapabilities[0].active = true;
      baseCapabilities[2].active = true;
    } else if (agentName.toLowerCase().includes('writer')) {
      baseCapabilities[1].active = true;
      baseCapabilities[3].active = true;
    }

    return baseCapabilities;
  };

  const [capabilities] = useState<AgentCapability[]>(getAgentCapabilities());

  // Sample messages with agent-specific content
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: `Hello! I'm ${agentName}, your AI collaboration partner. I'm specialized in ${capabilities.filter(c => c.active).map(c => c.name.toLowerCase()).join(', ')}. How can I assist you today?`,
      senderId: agentId,
      senderName: agentName,
      senderType: 'ai_agent' as const,
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      attachments: [],
      mentions: []
    }
  ]);

  // Handle sending messages with enhanced agent integration
  const handleSendMessage = (message: string, selectedAgents?: string[]) => {
    console.log('🤖 [AgentCommandCenter] Processing message:', { message, agent: agentName });
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      senderId: 'current-user',
      senderName: 'You',
      senderType: 'human' as const,
      timestamp: new Date(),
      attachments: [],
      mentions: [agentId] // Always mention the agent in command center
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Set agent as busy while processing
    setAgentStatus('busy');

    // Simulate enhanced agent response based on capabilities
    setTimeout(() => {
      const responses = generateAgentResponse(message);
      responses.forEach((response, index) => {
        setTimeout(() => {
          const agentResponse = {
            id: (Date.now() + index + 1).toString(),
            content: response,
            senderId: agentId,
            senderName: agentName,
            senderType: 'ai_agent' as const,
            timestamp: new Date(),
            attachments: [],
            mentions: []
          };
          setMessages(prev => [...prev, agentResponse]);
          
          // Set back to online after last response
          if (index === responses.length - 1) {
            setAgentStatus('online');
          }
        }, index * 1000);
      });
    }, 1500);
    
    // TODO: Integrate with real agent service
  };

  // Generate contextual agent responses based on capabilities
  const generateAgentResponse = (userMessage: string): string[] => {
    const message = userMessage.toLowerCase();
    const responses: string[] = [];

    // Analyze message intent and generate appropriate responses
    if (message.includes('analyze') || message.includes('data')) {
      responses.push(`I'll analyze that for you. Let me break down the key insights and patterns I can identify.`);
      if (capabilities.find(c => c.id === 'analysis')?.active) {
        responses.push(`Based on my analysis capabilities, I can provide statistical insights, trend analysis, and data visualization recommendations.`);
      }
    } else if (message.includes('write') || message.includes('content')) {
      responses.push(`I'd be happy to help with your writing needs. What type of content are you looking to create?`);
      if (capabilities.find(c => c.id === 'writing')?.active) {
        responses.push(`I can assist with various writing formats: articles, reports, emails, creative content, and more. Just let me know your requirements.`);
      }
    } else if (message.includes('code') || message.includes('program')) {
      if (capabilities.find(c => c.id === 'coding')?.active) {
        responses.push(`I can help with coding tasks. What programming language or framework are you working with?`);
      } else {
        responses.push(`While coding isn't my primary specialty, I can provide basic programming guidance. For complex coding tasks, you might want to collaborate with a specialized coding agent.`);
      }
    } else if (message.includes('creative') || message.includes('idea')) {
      responses.push(`Let's explore some creative solutions! I love brainstorming and innovative problem-solving.`);
      if (capabilities.find(c => c.id === 'creative')?.active) {
        responses.push(`I can help with ideation, creative writing, design concepts, and out-of-the-box thinking approaches.`);
      }
    } else {
      // General response
      responses.push(`I understand you said: "${userMessage}". Let me help you with that using my specialized capabilities in ${capabilities.filter(c => c.active).map(c => c.name.toLowerCase()).join(', ')}.`);
    }

    return responses;
  };

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Get status color
  const getStatusColor = () => {
    switch (agentStatus) {
      case 'online': return '#10b981';
      case 'busy': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Enhanced Agent Header */}
      <Box sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        {/* Agent Avatar with Status */}
        <Box sx={{ position: 'relative' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {agentName.charAt(0).toUpperCase()}
          </Avatar>
          {/* Status Indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: getStatusColor(),
              border: `2px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[2]
            }}
          />
        </Box>

        {/* Agent Info */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
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
            <Typography 
              variant="caption" 
              sx={{ 
                color: getStatusColor(),
                fontWeight: 500,
                textTransform: 'capitalize'
              }}
            >
              {agentStatus}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
            AI Agent Command Center
          </Typography>
        </Box>

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

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Agent settings">
            <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="More options">
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MoreIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Agent Capabilities Panel */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mb: 1, display: 'block' }}>
          Active Capabilities
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {capabilities.filter(cap => cap.active).map((capability) => (
            <Tooltip key={capability.id} title={capability.description}>
              <Chip
                icon={capability.icon}
                label={capability.name}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '11px',
                  height: 24,
                  '& .MuiChip-icon': {
                    fontSize: '14px'
                  }
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Agent Command Center Messaging */}
      <CollaborationMessaging
        item={{
          id: agentId,
          type: 'agent_command_center' as const,
          name: agentName,
          description: 'AI Agent Command Center'
        }}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTyping={(isTyping) => {
          console.log(`🤖 [${agentName}] User is ${isTyping ? 'typing' : 'not typing'}`);
        }}
      />

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement */ }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share conversation</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement */ }}>
          <ListItemIcon>
            <BookmarkIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bookmark session</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement */ }}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View history</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement */ }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Agent settings</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AgentCommandCenterWorkspace;

