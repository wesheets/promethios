/**
 * CollaborationNavigation - Slack-style left panel navigation
 * Organizes channels, direct messages, agent command centers, and connections
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Badge,
  Avatar,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  useTheme
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Tag as ChannelIcon,
  Person as PersonIcon,
  SmartToy as AgentIcon,
  Link as ConnectionIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Circle as OnlineIcon,
  RadioButtonUnchecked as OfflineIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon
} from '@mui/icons-material';

import { CollaborationItem } from '../../pages/CollaborationsPage';

interface CollaborationNavigationProps {
  items: CollaborationItem[];
  selectedItem: CollaborationItem | null;
  onItemSelect: (item: CollaborationItem) => void;
  onCreateNew?: (type: CollaborationItem['type']) => void;
}

interface NavigationSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: CollaborationItem[];
  expanded: boolean;
  canCreate: boolean;
}

const CollaborationNavigation: React.FC<CollaborationNavigationProps> = ({
  items,
  selectedItem,
  onItemSelect,
  onCreateNew
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionStates, setSectionStates] = useState<{[key: string]: boolean}>({
    channels: true,
    direct_messages: true,
    agent_command_centers: true,
    connections: true
  });

  // Filter items based on search query
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Organize items into sections
  const sections: NavigationSection[] = [
    {
      id: 'channels',
      title: 'Channels',
      icon: <ChannelIcon fontSize="small" />,
      items: filteredItems.filter(item => item.type === 'channel'),
      expanded: sectionStates.channels,
      canCreate: true
    },
    {
      id: 'direct_messages',
      title: 'Direct Messages',
      icon: <PersonIcon fontSize="small" />,
      items: filteredItems.filter(item => item.type === 'direct_message'),
      expanded: sectionStates.direct_messages,
      canCreate: true
    },
    {
      id: 'agent_command_centers',
      title: 'AI Agents',
      icon: <AgentIcon fontSize="small" />,
      items: filteredItems.filter(item => item.type === 'agent_command_center'),
      expanded: sectionStates.agent_command_centers,
      canCreate: true
    },
    {
      id: 'connections',
      title: 'Connections',
      icon: <ConnectionIcon fontSize="small" />,
      items: filteredItems.filter(item => item.type === 'connection'),
      expanded: sectionStates.connections,
      canCreate: false
    }
  ];

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Get total unread count
  const totalUnreadCount = items.reduce((total, item) => total + (item.unreadCount || 0), 0);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
    }}>
      {/* Search Bar */}
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search collaborations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9',
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                border: `1px solid ${theme.palette.primary.main}`
              }
            }
          }}
        />
      </Box>

      {/* Navigation Sections */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {sections.map((section) => (
          <Box key={section.id} sx={{ mb: 1 }}>
            {/* Section Header */}
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => toggleSection(section.id)}
                sx={{
                  py: 0.5,
                  px: 2,
                  minHeight: 32,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={section.title}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: theme.palette.text.secondary
                  }}
                />
                {section.canCreate && onCreateNew && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNew(section.id.slice(0, -1) as CollaborationItem['type']); // Remove 's' from end
                    }}
                    sx={{ 
                      width: 20, 
                      height: 20, 
                      mr: 0.5,
                      color: theme.palette.text.secondary,
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? '#475569' : '#e2e8f0'
                      }
                    }}
                  >
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                )}
                {section.expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </ListItemButton>
            </ListItem>

            {/* Section Items */}
            <Collapse in={section.expanded} timeout="auto" unmountOnExit>
              <List disablePadding>
                {section.items.length === 0 ? (
                  <ListItem sx={{ pl: 4, py: 0.5 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: theme.palette.text.disabled,
                        fontStyle: 'italic'
                      }}
                    >
                      No {section.title.toLowerCase()} yet
                    </Typography>
                  </ListItem>
                ) : (
                  section.items.map((item) => (
                    <NavigationItem
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => onItemSelect(item)}
                    />
                  ))
                )}
              </List>
            </Collapse>
          </Box>
        ))}
      </Box>

      {/* Footer Stats */}
      {totalUnreadCount > 0 && (
        <Box sx={{ 
          p: 2, 
          pt: 1,
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`
        }}>
          <Chip
            icon={<NotificationsIcon fontSize="small" />}
            label={`${totalUnreadCount} unread`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '11px' }}
          />
        </Box>
      )}
    </Box>
  );
};

// Individual Navigation Item Component
interface NavigationItemProps {
  item: CollaborationItem;
  selected: boolean;
  onClick: () => void;
}

const NavigationItem: React.FC<NavigationItemProps> = ({ item, selected, onClick }) => {
  const theme = useTheme();

  const getItemIcon = () => {
    switch (item.type) {
      case 'channel':
        return <ChannelIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />;
      case 'direct_message':
        return (
          <Box sx={{ position: 'relative' }}>
            <Avatar
              sx={{
                width: 20,
                height: 20,
                fontSize: '11px',
                bgcolor: theme.palette.primary.main
              }}
            >
              {item.avatar || item.name.charAt(0)}
            </Avatar>
            {/* Online status indicator */}
            {item.isOnline !== undefined && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: item.isOnline ? '#10b981' : '#6b7280',
                  border: `1px solid ${theme.palette.background.paper}`
                }}
              />
            )}
          </Box>
        );
      case 'agent_command_center':
        return (
          <Box
            sx={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: item.color || theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <AgentIcon fontSize="inherit" sx={{ color: 'white', fontSize: '12px' }} />
            {/* Online status for agents */}
            {item.isOnline && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  border: `1px solid ${theme.palette.background.paper}`
                }}
              />
            )}
          </Box>
        );
      case 'connection':
        return <ConnectionIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />;
      default:
        return null;
    }
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selected}
        onClick={onClick}
        sx={{
          pl: 3,
          pr: 2,
          py: 0.5,
          minHeight: 32,
          borderRadius: 1,
          mx: 1,
          '&:hover': {
            bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#f1f5f9'
          },
          '&.Mui-selected': {
            bgcolor: theme.palette.primary.main + '20',
            '&:hover': {
              bgcolor: theme.palette.primary.main + '30'
            }
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {getItemIcon()}
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '14px',
                  fontWeight: selected ? 600 : 400,
                  color: selected ? theme.palette.primary.main : theme.palette.text.primary,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.type === 'channel' ? '#' : ''}{item.name}
              </Typography>
              
              {/* Last activity */}
              {item.lastActivity && !selected && (
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '10px',
                    color: theme.palette.text.disabled,
                    flexShrink: 0
                  }}
                >
                  {formatLastActivity(item.lastActivity)}
                </Typography>
              )}
            </Box>
          }
          secondary={
            item.description && selected ? (
              <Typography
                variant="caption"
                sx={{
                  fontSize: '11px',
                  color: theme.palette.text.secondary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.description}
              </Typography>
            ) : null
          }
        />

        {/* Unread badge */}
        {item.unreadCount && item.unreadCount > 0 && (
          <Badge
            badgeContent={item.unreadCount > 99 ? '99+' : item.unreadCount}
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '10px',
                height: 16,
                minWidth: 16,
                padding: '0 4px'
              }
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );
};

export default CollaborationNavigation;

