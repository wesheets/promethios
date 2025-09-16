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
  Tooltip
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
          id: 'acme-leadership',
          name: 'leadership',
          description: 'Leadership team private channel',
          unreadCount: 0,
          isPrivate: true,
          memberCount: 5,
          lastActivity: new Date(Date.now() - 3600000)
        }
      ]
    },
    {
      id: 'project-alpha',
      name: 'Project Alpha',
      description: 'Alpha project collaboration',
      avatar: 'PA',
      memberCount: 8,
      isPrivate: true,
      channels: [
        {
          id: 'alpha-planning',
          name: 'planning',
          description: 'Project planning and coordination',
          unreadCount: 2,
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
          memberCount: 6,
          lastActivity: new Date()
        }
      ]
    }
  ]);

  const [generalChannels] = useState<Channel[]>([
    {
      id: 'public-general',
      name: 'general',
      description: 'Open community discussions',
      unreadCount: 12,
      isPrivate: false,
      memberCount: 234,
      lastActivity: new Date()
    },
    {
      id: 'public-announcements',
      name: 'announcements',
      description: 'Platform announcements',
      unreadCount: 1,
      isPrivate: false,
      memberCount: 456,
      lastActivity: new Date()
    },
    {
      id: 'public-help',
      name: 'help',
      description: 'Community help and support',
      unreadCount: 0,
      isPrivate: false,
      memberCount: 189,
      lastActivity: new Date(Date.now() - 7200000)
    }
  ]);

  const [directMessages] = useState<DirectMessage[]>([
    {
      id: 'dm-alice',
      name: 'Alice Johnson',
      avatar: 'AJ',
      isOnline: true,
      unreadCount: 2,
      lastActivity: new Date()
    },
    {
      id: 'dm-bob',
      name: 'Bob Smith',
      avatar: 'BS',
      isOnline: false,
      unreadCount: 0,
      lastActivity: new Date(Date.now() - 3600000)
    },
    {
      id: 'dm-carol',
      name: 'Carol Davis',
      avatar: 'CD',
      isOnline: true,
      unreadCount: 1,
      lastActivity: new Date(Date.now() - 1800000)
    }
  ]);

  const [aiAgents] = useState<AIAgent[]>([
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      avatar: 'DA',
      color: '#3b82f6',
      status: 'active',
      expertise: ['Data Analysis', 'Visualization']
    },
    {
      id: 'content-writer',
      name: 'Content Writer',
      avatar: 'CW',
      color: '#10b981',
      status: 'active',
      expertise: ['Writing', 'Marketing']
    },
    {
      id: 'research-assistant',
      name: 'Research Assistant',
      avatar: 'RA',
      color: '#8b5cf6',
      status: 'active',
      expertise: ['Research', 'Analysis']
    }
  ]);

  const [connections] = useState<Connection[]>([
    {
      id: 'conn-1',
      name: 'Tech Innovators',
      type: 'organization',
      avatar: 'TI',
      isOnline: true
    },
    {
      id: 'conn-2',
      name: 'Sarah Wilson',
      type: 'user',
      avatar: 'SW',
      isOnline: false
    }
  ]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle work collaboration expansion
  const toggleWorkCollab = (collabId: string) => {
    setExpandedWorkCollabs(prev => ({
      ...prev,
      [collabId]: !prev[collabId]
    }));
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
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        '& .MuiDrawer-paper': {
          width: width,
          bgcolor: '#1e293b',
          borderRight: '1px solid #334155',
          marginLeft: '64px', // Align with existing left nav bar
          height: 'calc(100vh - 0px)', // Full height
          top: 0,
          zIndex: 1200 // Below AgentDocker but above main content
        }
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
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Collaborations
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: '#94a3b8' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: '1px solid #334155' }}>
          <TextField
            fullWidth
            placeholder="Search collaborations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8' }} />
                </InputAdornment>
              ),
              sx: {
                bgcolor: '#334155',
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#475569'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#64748b'
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6'
                }
              }
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <List sx={{ p: 0 }}>
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
                  <OrganizationIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Work Collaborations"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0'
                  }}
                />
                {expandedSections.workCollaborations ? 
                  <ExpandLess sx={{ color: '#94a3b8' }} /> : 
                  <ExpandMore sx={{ color: '#94a3b8' }} />
                }
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedSections.workCollaborations}>
              {filterBySearch(workCollaborations, ['name', 'description']).map((workCollab) => (
                <Box key={workCollab.id}>
                  {/* Work Collaboration Header */}
                  <ListItem sx={{ px: 3, py: 0.5 }}>
                    <ListItemButton
                      onClick={() => toggleWorkCollab(workCollab.id)}
                      sx={{ 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#334155' }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Avatar
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: '#3b82f6'
                          }}
                        >
                          {workCollab.avatar}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={workCollab.name}
                        secondary={`${workCollab.memberCount} members`}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          color: '#f1f5f9'
                        }}
                        secondaryTypographyProps={{
                          fontSize: '0.7rem',
                          color: '#94a3b8'
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {workCollab.isPrivate && (
                          <PrivateIcon sx={{ color: '#94a3b8', fontSize: 14 }} />
                        )}
                        {expandedWorkCollabs[workCollab.id] ? 
                          <ExpandLess sx={{ color: '#94a3b8', fontSize: 16 }} /> : 
                          <ExpandMore sx={{ color: '#94a3b8', fontSize: 16 }} />
                        }
                      </Box>
                    </ListItemButton>
                  </ListItem>

                  {/* Work Collaboration Channels */}
                  <Collapse in={expandedWorkCollabs[workCollab.id]}>
                    {workCollab.channels.map((channel) => (
                      <ListItem key={channel.id} sx={{ px: 4, py: 0.25 }}>
                        <ListItemButton
                          sx={{ 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            '&:hover': { bgcolor: '#334155' }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            {channel.isPrivate ? (
                              <PrivateIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
                            ) : (
                              <ChannelIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={`# ${channel.name}`}
                            primaryTypographyProps={{
                              fontSize: '0.75rem',
                              color: '#cbd5e1'
                            }}
                          />
                          {channel.unreadCount && channel.unreadCount > 0 && (
                            <Badge
                              badgeContent={channel.unreadCount}
                              sx={{
                                '& .MuiBadge-badge': {
                                  bgcolor: '#ef4444',
                                  color: 'white',
                                  fontSize: '0.6rem',
                                  minWidth: 16,
                                  height: 16
                                }
                              }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </Collapse>
                </Box>
              ))}
            </Collapse>

            <Divider sx={{ bgcolor: '#334155', mx: 2, my: 1 }} />

            {/* General Channels */}
            <ListItem sx={{ px: 2, py: 1 }}>
              <ListItemButton
                onClick={() => toggleSection('channels')}
                sx={{ 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 1,
                  '&:hover': { bgcolor: '#334155' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <PublicIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="General Channels"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0'
                  }}
                />
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
                {expandedSections.channels ? 
                  <ExpandLess sx={{ color: '#94a3b8' }} /> : 
                  <ExpandMore sx={{ color: '#94a3b8' }} />
                }
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedSections.channels}>
              {filterBySearch(generalChannels, ['name', 'description']).map((channel) => (
                <ListItem key={channel.id} sx={{ px: 3, py: 0.25 }}>
                  <ListItemButton
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1,
                      '&:hover': { bgcolor: '#334155' }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <ChannelIcon sx={{ color: '#94a3b8', fontSize: 16 }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`# ${channel.name}`}
                      secondary={`${channel.memberCount} members`}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        color: '#f1f5f9'
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.7rem',
                        color: '#94a3b8'
                      }}
                    />
                    {channel.unreadCount && channel.unreadCount > 0 && (
                      <Badge
                        badgeContent={channel.unreadCount}
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: '#ef4444',
                            color: 'white',
                            fontSize: '0.6rem',
                            minWidth: 16,
                            height: 16
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
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
                  <DirectMessageIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Direct Messages"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0'
                  }}
                />
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
                {expandedSections.directMessages ? 
                  <ExpandLess sx={{ color: '#94a3b8' }} /> : 
                  <ExpandMore sx={{ color: '#94a3b8' }} />
                }
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedSections.directMessages}>
              {filterBySearch(directMessages, ['name']).map((dm) => (
                <ListItem key={dm.id} sx={{ px: 3, py: 0.25 }}>
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
                          sx={{ 
                            width: 20, 
                            height: 20, 
                            fontSize: '0.7rem',
                            bgcolor: '#64748b'
                          }}
                        >
                          {dm.avatar}
                        </Avatar>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: dm.isOnline ? '#10b981' : '#6b7280',
                            border: '1px solid #1e293b'
                          }}
                        />
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={dm.name}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        color: '#f1f5f9'
                      }}
                    />
                    {dm.unreadCount && dm.unreadCount > 0 && (
                      <Badge
                        badgeContent={dm.unreadCount}
                        sx={{
                          '& .MuiBadge-badge': {
                            bgcolor: '#ef4444',
                            color: 'white',
                            fontSize: '0.6rem',
                            minWidth: 16,
                            height: 16
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
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
                  <AgentIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="AI Agents"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0'
                  }}
                />
                <IconButton size="small" sx={{ color: '#94a3b8' }}>
                  <AddIcon fontSize="small" />
                </IconButton>
                {expandedSections.aiAgents ? 
                  <ExpandLess sx={{ color: '#94a3b8' }} /> : 
                  <ExpandMore sx={{ color: '#94a3b8' }} />
                }
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedSections.aiAgents}>
              {filterBySearch(aiAgents, ['name']).map((agent) => (
                <ListItem key={agent.id} sx={{ px: 3, py: 0.25 }}>
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
                          bgcolor: agent.color
                        }}
                      >
                        {agent.avatar}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={agent.name}
                      secondary={agent.expertise?.slice(0, 2).join(', ')}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        color: '#f1f5f9'
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
                  <ConnectionIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Connections"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#e2e8f0'
                  }}
                />
                {expandedSections.connections ? 
                  <ExpandLess sx={{ color: '#94a3b8' }} /> : 
                  <ExpandMore sx={{ color: '#94a3b8' }} />
                }
              </ListItemButton>
            </ListItem>

            <Collapse in={expandedSections.connections}>
              {connections.length === 0 ? (
                <ListItem sx={{ px: 3, py: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#94a3b8', 
                      fontSize: '0.75rem',
                      fontStyle: 'italic',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    No connections yet
                  </Typography>
                </ListItem>
              ) : (
                filterBySearch(connections, ['name']).map((connection) => (
                  <ListItem key={connection.id} sx={{ px: 3, py: 0.25 }}>
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
                            bgcolor: connection.type === 'organization' ? '#3b82f6' : '#64748b'
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
                          color: '#f1f5f9'
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
            </Collapse>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
};

export default CollaborationSlidePanel;

