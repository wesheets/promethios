/**
 * CollaborationSlidePanel - Slide-out panel for collaborations
 * 
 * Features:
 * - Slides out from the left when triggered
 * - Aligns with existing left navigation bar
 * - Preserves main content area (doesn't take over entire screen)
 * - Hierarchical organization structure (Work Collaborations > Channels)
 * - General public channels section
 * - Smooth animations and responsive design
 */

import React, { useState, useEffect } from 'react';
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
  Badge,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  Tooltip,
  Slide
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Tag as ChannelIcon,
  Message as DirectMessageIcon,
  SmartToy as AgentIcon,
  Link as ConnectionIcon,
  Business as OrganizationIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Circle as OnlineIcon,
  RadioButtonUnchecked as OfflineIcon
} from '@mui/icons-material';
import SocialNetworkPanel from '../social/SocialNetworkPanel';
import { usePanelManager } from '../../context/PanelManagerContext';

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

const CollaborationSlidePanel: React.FC<CollaborationSlidePanel> = ({
  open,
  onClose,
  width = 320
}) => {
  const { openPanel, closePanel, isPanelOpen, getPanelWidth } = usePanelManager();
  
  // State for expanded sections
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

  // Check if social panel is open
  const socialPanelOpen = isPanelOpen('social');

  // Handle social panel toggle
  const handleSocialToggle = () => {
    if (socialPanelOpen) {
      closePanel('social');
    } else {
      openPanel('social', 'social', 'Professional Network');
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

  const [aiAgents] = useState<AIAgent[]>([
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      avatar: 'DA',
      color: '#10b981',
      status: 'active',
      expertise: ['Data Analysis', 'Visualization']
    },
    {
      id: 'content-writer',
      name: 'Content Writer',
      avatar: 'CW',
      color: '#8b5cf6',
      status: 'active',
      expertise: ['Writing', 'Marketing']
    },
    {
      id: 'research-assistant',
      name: 'Research Assistant',
      avatar: 'RA',
      color: '#f59e0b',
      status: 'active',
      expertise: ['Research', 'Analysis']
    }
  ]);

  const [connections] = useState<Connection[]>([
    {
      id: 'tech-corp',
      name: 'Tech Corp',
      type: 'organization',
      avatar: 'TC',
      isOnline: false
    },
    {
      id: 'jane-doe',
      name: 'Jane Doe',
      type: 'user',
      avatar: 'JD',
      isOnline: true
    },
    {
      id: 'startup-inc',
      name: 'Startup Inc',
      type: 'organization',
      avatar: 'SI',
      isOnline: false
    }
  ]);

  // Toggle section expansion
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

  // Handle AI agent click
  const handleAgentClick = (agentId: string, agentName: string) => {
    console.log('Starting conversation with agent:', agentId, agentName);
    // This would start a conversation with the AI agent
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
            width: width,
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
                      <DirectMessageIcon sx={{ color: '#cbd5e1', fontSize: 20 }} />
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
                    {filterBySearch(aiAgents, ['name', 'expertise']).map((agent) => (
                      <ListItem key={agent.id} sx={{ px: 2, py: 0.5 }}>
                        <ListItemButton
                          onClick={() => handleAgentClick(agent.id, agent.name)}
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
                                bgcolor: agent.color
                              }}
                            >
                              {agent.avatar}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={agent.name}
                            secondary={agent.expertise?.join(', ')}
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
                            label={agent.status}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              bgcolor: agent.status === 'active' ? '#10b981' : '#6b7280',
                              color: 'white'
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
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
                    {filterBySearch(connections, ['name', 'type']).map((connection) => (
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
                            <Avatar
                              sx={{ 
                                width: 20, 
                                height: 20, 
                                fontSize: '0.7rem',
                                bgcolor: connection.type === 'organization' ? '#6366f1' : '#64748b'
                              }}
                            >
                              {connection.avatar}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText 
                            primary={connection.name}
                            secondary={connection.type}
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
                    ))}
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
                    <PublicIcon sx={{ color: '#6366f1', fontSize: '1.2rem' }} />
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
    </>
  );
};

export default CollaborationSlidePanel;

