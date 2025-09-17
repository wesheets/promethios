/**
 * CollaborationSlidePanel - Enhanced slide-out panel for team collaboration
 * 
 * Features:
 * - Slides from left side with smooth animations
 * - Matches left navigation background color (#1e293b)
 * - Preserves main content area (doesn't take over entire screen)
 * - Hierarchical organization structure (Work Collaborations > Channels)
 * - General public channels section
 * - Smooth animations and responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  InputAdornment,
  Avatar,
  Slide,
  Badge,
  CircularProgress,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandMore,
  ExpandLess,
  Tag as ChannelIcon,
  Lock as PrivateIcon,
  Person as PersonIcon,
  SmartToy as AgentIcon,
  Business as OrganizationIcon,
  Public as SocialIcon,
  AccountTree as AccountTreeIcon,
  FiberManualRecord as OnlineIcon,
  RadioButtonUnchecked as OfflineIcon,
  Link as ConnectionIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { usePanelManager } from '../../context/PanelManagerContext';
import SocialNetworkPanel from '../social/SocialNetworkPanel';
import WorkflowPanel from '../workflow/WorkflowPanel';
import ChannelCreationModal from './ChannelCreationModal';
import MessageCreationModal from './MessageCreationModal';
import HumanMessagingPanel from './HumanMessagingPanel';
import { useAuth } from '../../context/AuthContext';
import ChatbotStorageService, { ChatbotProfile } from '../../services/ChatbotStorageService';
import { firebaseDirectMessageService, UserConnection } from '../../services/FirebaseDirectMessageService';

interface CollaborationSlidePanelProps {
  open: boolean;
  onClose: () => void;
}

interface CollaborationSlidePanel {
  open: boolean;
  onClose: () => void;
  width?: number;
}

interface WorkCollaboration {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  channels: Channel[];
  memberCount: number;
  isPrivate: boolean;
}

interface Channel {
  id: string;
  name: string;
  description?: string;
  unreadCount?: number;
  isPrivate: boolean;
  lastActivity?: Date;
  memberCount: number;
}

interface DirectMessage {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  unreadCount?: number;
  lastActivity?: Date;
}

interface AIAgent {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'active' | 'inactive';
  expertise?: string[];
}

interface Connection {
  id: string;
  name: string;
  type: 'user' | 'organization';
  avatar?: string;
  isOnline?: boolean;
}
const CollaborationSlidePanel: React.FC<CollaborationSlidePanelProps> = ({ 
  open, 
  onClose 
}) => {
  const { openPanel, closePanel, isPanelOpen, getPanelWidth } = usePanelManager();
  const { user, authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Real agents from Firebase
  const [aiAgents, setAiAgents] = useState<ChatbotProfile[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const chatbotServiceRef = useRef<ChatbotStorageService | null>(null);

  // Initialize chatbot service
  useEffect(() => {
    if (!chatbotServiceRef.current) {
      chatbotServiceRef.current = ChatbotStorageService.getInstance();
    }
  }, []);

  // Load real agents from Firebase
  const loadAgents = async () => {
    if (!user?.uid || authLoading || !chatbotServiceRef.current) return;

    try {
      setAgentsLoading(true);
      const chatbotProfiles = await chatbotServiceRef.current.getChatbots(user.uid);
      console.log('🤝 [CollaborationPanel] Loaded agents:', chatbotProfiles.length);
      setAiAgents(chatbotProfiles);
    } catch (error) {
      console.error('❌ [CollaborationPanel] Failed to load agents:', error);
      setAiAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Load agents when user is available
  useEffect(() => {
    if (user?.uid && !authLoading) {
      loadAgents();
      loadConnections();
    }
  }, [user?.uid, authLoading]);

  // Load user connections from Firebase
  const loadConnections = async () => {
    try {
      setConnectionsLoading(true);
      const userConnections = await firebaseDirectMessageService.getUserConnections();
      setConnections(userConnections);
    } catch (error) {
      console.error('❌ [CollaborationPanel] Failed to load connections:', error);
      setConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workCollaborations: true,
    channels: true,
    directMessages: true,
    aiAgents: true,
    connections: false
  });

  // State for expanded work collaborations
  const [expandedWorkCollabs, setExpandedWorkCollabs] = useState<Record<string, boolean>>({});

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Channel creation modal state  const [channelCreationModalOpen, setChannelCreationModalOpen] = useState(false);
  const [messageCreationModalOpen, setMessageCreationModalOpen] = useState(false);
  const [messagingPanelOpen, setMessagingPanelOpen] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<{
    type: 'channel' | 'direct_message';
    id: string;
    name: string;
    participants?: Array<{
      id: string;
      name: string;
      avatar?: string;
      isOnline?: boolean;
    }>;
  } | null>(null);

  // Check if social panel is open
  const socialPanelOpen = isPanelOpen('social');
  
  // Check if workflow panel is open
  const workflowPanelOpen = isPanelOpen('workflow');

  // Handle social panel toggle
  const handleSocialToggle = () => {
    if (socialPanelOpen) {
      closePanel('social');
    } else {
      openPanel('social', 'social', 'Professional Network');
    }
  };

  // Handle workflow panel toggle
  const handleWorkflowToggle = () => {
    if (workflowPanelOpen) {
      closePanel('workflow');
    } else {
      openPanel('workflow', 'workflow', 'AI Agent Workflows');
    }
  };

  // Calculate panel width based on panel manager
  const panelWidth = open ? getPanelWidth('collaboration') : '0px';

  // Sample data - will be replaced with real Firebase data
  const [workCollaborations] = useState<WorkCollaboration[]>([
    {
      id: 'acme-corp',
      name: 'ACME Corporation',
      description: 'Main company workspace',
      avatar: 'AC',
      memberCount: 45,
      isPrivate: true,
      channels: [
        {
          id: 'acme-general',
          name: 'general',
          description: 'General company discussions',
          unreadCount: 3,
          isPrivate: false,
          memberCount: 45,
          lastActivity: new Date()
        },
        {
          id: 'acme-engineering',
          name: 'engineering',
          description: 'Engineering team discussions',
          unreadCount: 7,
          isPrivate: false,
          memberCount: 12,
          lastActivity: new Date()
        },
        {
          id: 'acme-design',
          name: 'design',
          description: 'Design team discussions',
          unreadCount: 0,
          isPrivate: true,
          memberCount: 8,
          lastActivity: new Date()
        }
      ]
    },
    {
      id: 'startup-alpha',
      name: 'Project Alpha',
      description: 'Stealth startup project',
      avatar: 'PA',
      memberCount: 8,
      isPrivate: true,
      channels: [
        {
          id: 'alpha-general',
          name: 'general',
          description: 'General project discussions',
          unreadCount: 12,
          isPrivate: false,
          memberCount: 8,
          lastActivity: new Date()
        },
        {
          id: 'alpha-dev',
          name: 'development',
          description: 'Development discussions',
          unreadCount: 5,
          isPrivate: false,
          memberCount: 4,
          lastActivity: new Date()
        }
      ]
    }
  ]);

  const [directMessages] = useState<DirectMessage[]>([
    {
      id: 'alice-johnson',
      name: 'Alice Johnson',
      avatar: 'AJ',
      isOnline: true,
      unreadCount: 2,
      lastActivity: new Date()
    },
    {
      id: 'bob-smith',
      name: 'Bob Smith',
      avatar: 'BS',
      isOnline: false,
      unreadCount: 0,
      lastActivity: new Date()
    },
    {
      id: 'carol-davis',
      name: 'Carol Davis',
      avatar: 'CD',
      isOnline: true,
      unreadCount: 1,
      lastActivity: new Date()
    }
  ]);
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Toggle work collaboration expansion
  const toggleWorkCollab = (collabId: string) => {
    setExpandedWorkCollabs(prev => ({
      ...prev,
      [collabId]: !prev[collabId]
    }));
  };

  // Handle channel click
  const handleChannelClick = (channelId: string, channelName: string) => {
    console.log('Opening channel:', channelId, channelName);
    // This would open the channel in the main content area
  };

  // Handle direct message click
  const handleDirectMessageClick = (userId: string, userName: string) => {
    console.log('Opening DM with:', userId, userName);
    // This would open the DM in the main content area
  };

  // Handle AI agent click - Open Command Center in new panel
  const handleAgentClick = (agentId: string, agentName: string) => {
    console.log('🤖 [CollaborationPanel] Opening Command Center for agent:', agentId, agentName);
    
    // Find the agent to get the full profile
    const agent = aiAgents.find(a => {
      const currentAgentId = a.identity?.id || a.chatbotMetadata?.id || a.name;
      return currentAgentId === agentId;
    });
    if (!agent) {
      console.error('❌ [CollaborationPanel] Agent not found:', agentId);
      return;
    }

    // Open the Command Center panel using the same URL pattern as the main chatbots page
    const commandCenterUrl = `/ui/chat/chatbots/${agentId}/command-center`;
    
    // Open as new panel - this will trigger 50/50 split if collaboration panel is already open
    openPanel(`agent-${agentId}`, 'agent', `${agentName} Command Center`);
    
    // Navigate to the command center (this would be handled by the panel content)
    console.log('🎯 [CollaborationPanel] Command Center URL:', commandCenterUrl);
  };

  // Handle channel creation
  const handleCreateChannel = (organizationId: string, organizationName: string) => {
    setSelectedOrganization({ id: organizationId, name: organizationName });
    setChannelCreationModalOpen(true);
  };

  const handleChannelCreated = (channelData: {
    id: string;
    name: string;
    participants: Array<{
      id: string;
      name: string;
      avatar?: string;
      isOnline?: boolean;
    }>;
  }) => {
    console.log('✅ [CollaborationPanel] Channel created:', channelData);
    
    // Close the creation modal
    setChannelCreationModalOpen(false);
    setSelectedOrganization(null);
    
    // Set up the conversation for messaging panel
    setCurrentConversation({
      type: 'channel',
      id: channelData.id,
      name: channelData.name,
      participants: channelData.participants
    });
    
    // Open messaging panel using panel manager
    openPanel(`messaging-${channelData.id}`, 'messaging', `#${channelData.name}`);
    setMessagingPanelOpen(true);
  };

  // Handle message creation
  const handleMessageCreated = (messageData: {
    id: string;
    participant: {
      id: string;
      name: string;
      avatar?: string;
      isOnline?: boolean;
    };
  }) => {
    console.log('✅ [CollaborationPanel] Message created:', messageData);
    
    // Close the creation modal
    setMessageCreationModalOpen(false);
    
    // Set up the conversation for messaging panel
    setCurrentConversation({
      type: 'direct_message',
      id: messageData.id,
      name: messageData.participant.name,
      participants: [messageData.participant]
    });
    
    // Open messaging panel using panel manager
    openPanel(`messaging-${messageData.id}`, 'messaging', messageData.participant.name);
    setMessagingPanelOpen(true);
  };

  // Handle messaging panel close
  const handleMessagingPanelClose = () => {
    setMessagingPanelOpen(false);
    setCurrentConversation(null);
    
    // Close panel in panel manager
    if (currentConversation) {
      closePanel(`messaging-${currentConversation.id}`);
    }
  };

  // Filter items based on search
  const filterBySearch = (items: any[], searchFields: string[]) => {
    if (!searchQuery) return items;
    return items.filter(item =>
      searchFields.some(field =>
        item[field]?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  return (
    <>
      <Slide direction="right" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: '64px', // Position after left nav
            width: panelWidth,
            height: '100vh',
            bgcolor: '#1e293b', // Exact match with left navigation
            borderRight: '1px solid #334155', // Exact match with left navigation border
            zIndex: 1200, // Below AgentDocker but above main content
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6" sx={{ color: '#f8fafc', fontWeight: 600 }}>
                Collaborations
              </Typography>
              <IconButton 
                onClick={onClose}
                size="small"
                sx={{ 
                  color: '#cbd5e1',
                  '&:hover': { bgcolor: '#334155' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Search */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search collaborations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: '#334155',
                    border: '1px solid #475569',
                    borderRadius: 1,
                    color: '#f8fafc',
                    '& input::placeholder': {
                      color: '#94a3b8',
                      opacity: 1
                    },
                    '&:hover': {
                      border: '1px solid #64748b'
                    },
                    '&.Mui-focused': {
                      border: '1px solid #6366f1'
                    }
                  }
                }}
              />
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <List sx={{ py: 0 }}>
                {/* Work Collaborations */}
                <ListItem sx={{ px: 2, py: 1 }}>
                  <ListItemButton
                    onClick={() => toggleSection('workCollaborations')}
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <OrganizationIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Work Collaborations"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }}
                    />
                    {expandedSections.workCollaborations ? 
                      <ExpandLess sx={{ color: '#cbd5e1' }} /> : 
                      <ExpandMore sx={{ color: '#cbd5e1' }} />
                    }
                  </ListItemButton>
                </ListItem>

                <Collapse in={expandedSections.workCollaborations} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {filterBySearch(workCollaborations, ['name', 'description']).map((collab) => (
                      <Box key={collab.id}>
                        <ListItem sx={{ px: 2, py: 0.5 }}>
                          <ListItemButton
                            onClick={() => toggleWorkCollab(collab.id)}
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              '&:hover': { bgcolor: '#334155' }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <Avatar
                                sx={{ 
                                  width: 20, 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  bgcolor: collab.isPrivate ? '#ef4444' : '#10b981'
                                }}
                              >
                                {collab.avatar}
                              </Avatar>
                            </ListItemIcon>
                            <ListItemText 
                              primary={collab.name}
                              secondary={`${collab.memberCount} members`}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                color: '#f8fafc'
                              }}
                              secondaryTypographyProps={{
                                fontSize: '0.7rem',
                                color: '#94a3b8'
                              }}
                            />
                            {collab.isPrivate && (
                              <PrivateIcon sx={{ color: '#94a3b8', fontSize: 14, mr: 1 }} />
                            )}
                            {expandedWorkCollabs[collab.id] ? 
                              <ExpandLess sx={{ color: '#cbd5e1', fontSize: 16 }} /> : 
                              <ExpandMore sx={{ color: '#cbd5e1', fontSize: 16 }} />
                            }
                          </ListItemButton>
                        </ListItem>

                        {/* Channels under this collaboration */}
                        <Collapse in={expandedWorkCollabs[collab.id]} timeout="auto" unmountOnExit>
                          <List component="div" disablePadding sx={{ pl: 3 }}>
                            {collab.channels.map((channel) => (
                              <ListItem key={channel.id} sx={{ px: 1, py: 0.25 }}>
                                <ListItemButton
                                  onClick={() => handleChannelClick(channel.id, channel.name)}
                                  sx={{ 
                                    px: 1, 
                                    py: 0.25, 
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#334155' }
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 24 }}>
                                    <ChannelIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={`# ${channel.name}`}
                                    primaryTypographyProps={{
                                      fontSize: '0.75rem',
                                      color: '#cbd5e1'
                                    }}
                                  />
                                  {channel.isPrivate && (
                                    <PrivateIcon sx={{ color: '#94a3b8', fontSize: 12, mr: 0.5 }} />
                                  )}
                                  {channel.unreadCount > 0 && (
                                    <Badge 
                                      badgeContent={channel.unreadCount} 
                                      color="error"
                                      sx={{
                                        '& .MuiBadge-badge': {
                                          fontSize: '0.6rem',
                                          height: 16,
                                          minWidth: 16
                                        }
                                      }}
                                    />
                                  )}
                                </ListItemButton>
                              </ListItem>
                            ))}
                            
                            {/* Add Channel Button */}
                            <ListItem sx={{ px: 1, py: 0.25 }}>
                              <ListItemButton
                                onClick={() => handleCreateChannel(collab.id, collab.name)}
                                sx={{ 
                                  px: 1, 
                                  py: 0.25, 
                                  borderRadius: 1,
                                  opacity: 0.7,
                                  '&:hover': { opacity: 1, bgcolor: '#334155' }
                                }}
                              >
                                <ListItemIcon sx={{ minWidth: 24 }}>
                                  <AddIcon sx={{ color: '#10b981', fontSize: 16 }} />
                                </ListItemIcon>
                                <ListItemText 
                                  primary="Add Channel"
                                  primaryTypographyProps={{
                                    fontSize: '0.75rem',
                                    color: '#10b981',
                                    fontStyle: 'italic'
                                  }}
                                />
                              </ListItemButton>
                            </ListItem>
                          </List>
                        </Collapse>
                      </Box>
                    ))}
                  </List>
                </Collapse>

                <Divider sx={{ bgcolor: '#334155', mx: 2, my: 1 }} />

                {/* Direct Messages */}
                <ListItem sx={{ px: 2, py: 1 }}>
                  <ListItemButton
                    onClick={() => toggleSection('directMessages')}
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <PersonIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Direct Messages"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }}
                    />
                    {expandedSections.directMessages ? 
                      <ExpandLess sx={{ color: '#cbd5e1' }} /> : 
                      <ExpandMore sx={{ color: '#cbd5e1' }} />
                    }
                  </ListItemButton>
                </ListItem>

                <Collapse in={expandedSections.directMessages} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {filterBySearch(directMessages, ['name']).map((dm) => (
                      <ListItem key={dm.id} sx={{ px: 2, py: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleDirectMessageClick(dm.id, dm.name)}
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#334155' }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Box sx={{ position: 'relative' }}>
                              <Avatar
                                sx={{ 
                                  width: 20, 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  bgcolor: '#64748b'
                                }}
                              >
                                {dm.avatar}
                              </Avatar>
                              {dm.isOnline ? (
                                <OnlineIcon 
                                  sx={{ 
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    fontSize: 8,
                                    color: '#10b981'
                                  }} 
                                />
                              ) : (
                                <OfflineIcon 
                                  sx={{ 
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    fontSize: 8,
                                    color: '#6b7280'
                                  }} 
                                />
                              )}
                            </Box>
                          </ListItemIcon>
                          <ListItemText 
                            primary={dm.name}
                            primaryTypographyProps={{
                              fontSize: '0.8rem',
                              color: '#f8fafc'
                            }}
                          />
                          {dm.unreadCount > 0 && (
                            <Badge 
                              badgeContent={dm.unreadCount} 
                              color="error"
                              sx={{
                                '& .MuiBadge-badge': {
                                  fontSize: '0.6rem',
                                  height: 16,
                                  minWidth: 16
                                }
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                    
                    {/* Add Message Button */}
                    <ListItem sx={{ px: 2, py: 0.5 }}>
                      <ListItemButton
                        onClick={() => setMessageCreationModalOpen(true)}
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          opacity: 0.7,
                          '&:hover': { opacity: 1, bgcolor: '#334155' }
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <AddIcon sx={{ color: '#10b981', fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary="New Message"
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: '#10b981',
                            fontStyle: 'italic'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Collapse>

                <Divider sx={{ bgcolor: '#334155', mx: 2, my: 1 }} />

                {/* AI Agents */}
                <ListItem sx={{ px: 2, py: 1 }}>
                  <ListItemButton
                    onClick={() => toggleSection('aiAgents')}
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <AgentIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="AI Agents"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }}
                    />
                    {expandedSections.aiAgents ? 
                      <ExpandLess sx={{ color: '#cbd5e1' }} /> : 
                      <ExpandMore sx={{ color: '#cbd5e1' }} />
                    }
                  </ListItemButton>
                </ListItem>

                <Collapse in={expandedSections.aiAgents} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {agentsLoading ? (
                      <ListItem sx={{ px: 2, py: 1 }}>
                        <ListItemText 
                          primary="Loading agents..."
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            fontStyle: 'italic'
                          }}
                        />
                      </ListItem>
                    ) : aiAgents.length === 0 ? (
                      <ListItem sx={{ px: 2, py: 1 }}>
                        <ListItemText 
                          primary="No agents available"
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            fontStyle: 'italic'
                          }}
                        />
                      </ListItem>
                    ) : (
                      filterBySearch(aiAgents, ['identity.name', 'name']).map((agent) => {
                        const agentId = agent.identity?.id || agent.chatbotMetadata?.id || agent.name;
                        const agentName = agent.identity?.name || 'Unnamed Agent';
                        const agentAvatar = agent.identity?.avatar || agentName.charAt(0).toUpperCase();
                        
                        return (
                          <ListItem key={agentId} sx={{ px: 2, py: 0.5 }}>
                            <ListItemButton
                              onClick={() => handleAgentClick(agentId, agentName)}
                              sx={{ 
                                px: 1, 
                                py: 0.5, 
                                borderRadius: 1,
                                '&:hover': { bgcolor: '#334155' }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 28 }}>
                                <Avatar
                                  sx={{ 
                                    width: 20, 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    bgcolor: '#10b981' // Default green for active agents
                                  }}
                                >
                                  {agentAvatar}
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText 
                                primary={agentName}
                                secondary="Command Center"
                                primaryTypographyProps={{
                                  fontSize: '0.8rem',
                                  color: '#f8fafc'
                                }}
                                secondaryTypographyProps={{
                                  fontSize: '0.7rem',
                                  color: '#94a3b8'
                                }}
                              />
                              <Chip
                                label="ACTIVE"
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: '0.6rem',
                                  bgcolor: '#10b981',
                                  color: 'white',
                                  '& .MuiChip-label': { px: 1 }
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })
                    )}
                  </List>
                </Collapse>

                <Divider sx={{ bgcolor: '#334155', mx: 2, my: 1 }} />

                {/* Connections */}
                <ListItem sx={{ px: 2, py: 1 }}>
                  <ListItemButton
                    onClick={() => toggleSection('connections')}
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ConnectionIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Connections"
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }}
                    />
                    {expandedSections.connections ? 
                      <ExpandLess sx={{ color: '#cbd5e1' }} /> : 
                      <ExpandMore sx={{ color: '#cbd5e1' }} />
                    }
                  </ListItemButton>
                </ListItem>

                <Collapse in={expandedSections.connections} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 2 }}>
                    {connectionsLoading ? (
                      <ListItem sx={{ px: 2, py: 2, justifyContent: 'center' }}>
                        <CircularProgress size={20} sx={{ color: '#10b981' }} />
                      </ListItem>
                    ) : connections.length === 0 ? (
                      <ListItem sx={{ px: 2, py: 2 }}>
                        <ListItemText 
                          primary="No connections yet"
                          primaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: '#94a3b8',
                            textAlign: 'center'
                          }}
                        />
                      </ListItem>
                    ) : (
                      filterBySearch(connections, ['connectedUserName', 'connectedUserCompany']).map((connection) => (
                        <ListItem key={connection.id} sx={{ px: 2, py: 0.5 }}>
                          <ListItemButton
                            sx={{ 
                              px: 1, 
                              py: 0.5, 
                              borderRadius: 1,
                              '&:hover': { bgcolor: '#334155' }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <Box sx={{ position: 'relative' }}>
                                <Avatar
                                  src={connection.connectedUserAvatar}
                                  sx={{ 
                                    width: 20, 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    bgcolor: '#64748b'
                                  }}
                                >
                                  {connection.connectedUserName.charAt(0).toUpperCase()}
                                </Avatar>
                                {connection.isOnline && (
                                  <OnlineIcon 
                                    sx={{ 
                                      position: 'absolute', 
                                      bottom: -2, 
                                      right: -2,
                                      fontSize: 8,
                                      color: '#10b981'
                                    }} 
                                  />
                                )}
                              </Box>
                            </ListItemIcon>
                            <ListItemText 
                              primary={connection.connectedUserName}
                              secondary={connection.connectedUserTitle || connection.connectedUserCompany}
                              primaryTypographyProps={{
                                fontSize: '0.8rem',
                                color: '#f8fafc'
                              }}
                              secondaryTypographyProps={{
                                fontSize: '0.7rem',
                                color: '#94a3b8'
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))
                    )}
                  </List>
                </Collapse>
              </List>

              {/* Social Network Button */}
              <Box sx={{ mt: 2, px: 2 }}>
                <Divider sx={{ bgcolor: '#334155', mb: 2 }} />
                <ListItemButton
                  onClick={handleSocialToggle}
                  sx={{
                    borderRadius: 1,
                    bgcolor: socialPanelOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    border: socialPanelOpen ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.2)',
                      border: '1px solid rgba(99, 102, 241, 0.5)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SocialIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Social"
                    secondary="Professional Network"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
                      color: '#6366f1'
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: '#94a3b8'
                    }}
                  />
                </ListItemButton>

                {/* AI Agent Workflows Button */}
                <ListItemButton
                  onClick={handleWorkflowToggle}
                  sx={{
                    borderRadius: 1,
                    mt: 1,
                    bgcolor: workflowPanelOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                    border: workflowPanelOpen ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(16, 185, 129, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.5)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AccountTreeIcon sx={{ color: '#10b981', fontSize: '1.2rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Workflows"
                    secondary="AI Agent Automation"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
                      color: '#10b981'
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      color: '#94a3b8'
                    }}
                  />
                </ListItemButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </Slide>

      {/* Social Network Panel */}
      <SocialNetworkPanel
        open={socialPanelOpen}
        onClose={() => closePanel('social')}
        width={socialPanelOpen ? getPanelWidth('social') : '0%'}
      />

      {/* AI Agent Workflow Panel */}
      <WorkflowPanel
        open={workflowPanelOpen}
        onClose={() => closePanel('workflow')}
        width={workflowPanelOpen ? getPanelWidth('workflow') : '0%'}
      />

      {/* Channel Creation Modal */}
      {selectedOrganization && (
        <ChannelCreationModal
          open={channelCreationModalOpen}
          onClose={() => {
            setChannelCreationModalOpen(false);
            setSelectedOrganization(null);
          }}
          organizationId={selectedOrganization.id}
          organizationName={selectedOrganization.name}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {/* Message Creation Modal */}
      <MessageCreationModal
        open={messageCreationModalOpen}
        onClose={() => setMessageCreationModalOpen(false)}
        onMessageCreated={handleMessageCreated}
      />

      {/* Human Messaging Panel */}
      {messagingPanelOpen && currentConversation && (
        <HumanMessagingPanel
          open={messagingPanelOpen}
          onClose={handleMessagingPanelClose}
          width={getPanelWidth(`messaging-${currentConversation.id}`)}
          conversationType={currentConversation.type}
          conversationId={currentConversation.id}
          conversationName={currentConversation.name}
          participants={currentConversation.participants || []}
        />
      )}
    </>
  );
};

export default CollaborationSlidePanel;

