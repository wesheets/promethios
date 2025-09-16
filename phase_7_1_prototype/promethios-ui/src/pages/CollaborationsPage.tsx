/**
 * CollaborationsPage - The future of AI-native collaboration
 * Combines Slack-style organization with powerful AI agent integration
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Divider,
  useTheme,
  Drawer,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ViewColumn as ViewColumnIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

import CollaborationNavigation from '../components/collaboration/CollaborationNavigation';
import WorkspaceManager from '../components/collaboration/WorkspaceManager';

// Types for collaboration items
export interface CollaborationItem {
  id: string;
  type: 'channel' | 'direct_message' | 'agent_command_center' | 'connection';
  name: string;
  description?: string;
  avatar?: string;
  color?: string;
  unreadCount?: number;
  isOnline?: boolean;
  lastActivity?: Date;
}

export interface WorkspaceLayout {
  mode: 'single' | 'split';
  primary: CollaborationItem | null;
  secondary: CollaborationItem | null;
}

const CollaborationsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Layout state
  const [leftPanelOpen, setLeftPanelOpen] = useState(!isMobile);
  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayout>({
    mode: 'single',
    primary: null,
    secondary: null
  });

  // Sample data - will be replaced with real data
  const [collaborationItems] = useState<CollaborationItem[]>([
    // Channels
    {
      id: 'general',
      type: 'channel',
      name: 'general',
      description: 'General team discussions',
      unreadCount: 3,
      lastActivity: new Date()
    },
    {
      id: 'project-alpha',
      type: 'channel',
      name: 'project-alpha',
      description: 'Alpha project coordination',
      unreadCount: 7,
      lastActivity: new Date()
    },
    
    // Direct Messages
    {
      id: 'dm-alice',
      type: 'direct_message',
      name: 'Alice Johnson',
      avatar: 'AJ',
      isOnline: true,
      unreadCount: 2,
      lastActivity: new Date()
    },
    {
      id: 'dm-bob',
      type: 'direct_message',
      name: 'Bob Smith',
      avatar: 'BS',
      isOnline: false,
      lastActivity: new Date(Date.now() - 3600000) // 1 hour ago
    },
    
    // Agent Command Centers
    {
      id: 'agent-analyst',
      type: 'agent_command_center',
      name: 'Data Analyst',
      description: 'AI Data Analysis & Insights',
      color: '#3b82f6',
      isOnline: true,
      lastActivity: new Date()
    },
    {
      id: 'agent-writer',
      type: 'agent_command_center',
      name: 'Content Writer',
      description: 'AI Writing & Content Creation',
      color: '#10b981',
      isOnline: true,
      lastActivity: new Date()
    },
    {
      id: 'agent-researcher',
      type: 'agent_command_center',
      name: 'Research Assistant',
      description: 'AI Research & Information Gathering',
      color: '#8b5cf6',
      isOnline: true,
      lastActivity: new Date()
    }
  ]);

  // Handle collaboration item selection
  const handleItemSelect = (item: CollaborationItem) => {
    if (workspaceLayout.mode === 'single' || !workspaceLayout.primary) {
      // Open as primary (single view)
      setWorkspaceLayout({
        mode: 'single',
        primary: item,
        secondary: null
      });
    } else if (workspaceLayout.mode === 'single' && workspaceLayout.primary) {
      // Switch to split view
      setWorkspaceLayout({
        mode: 'split',
        primary: workspaceLayout.primary,
        secondary: item
      });
    } else if (workspaceLayout.mode === 'split') {
      // Replace secondary in split view
      setWorkspaceLayout({
        ...workspaceLayout,
        secondary: item
      });
    }
    
    // Close left panel on mobile after selection
    if (isMobile) {
      setLeftPanelOpen(false);
    }
  };

  // Handle layout mode changes
  const toggleLayoutMode = () => {
    if (workspaceLayout.mode === 'single' && workspaceLayout.primary) {
      // Can't switch to split without a secondary item
      return;
    }
    
    setWorkspaceLayout(prev => ({
      ...prev,
      mode: prev.mode === 'single' ? 'split' : 'single',
      secondary: prev.mode === 'single' ? null : prev.secondary
    }));
  };

  // Close collaboration item
  const closeCollaborationItem = (position: 'primary' | 'secondary') => {
    if (position === 'primary') {
      if (workspaceLayout.secondary) {
        // Move secondary to primary
        setWorkspaceLayout({
          mode: 'single',
          primary: workspaceLayout.secondary,
          secondary: null
        });
      } else {
        // Close primary
        setWorkspaceLayout({
          mode: 'single',
          primary: null,
          secondary: null
        });
      }
    } else {
      // Close secondary
      setWorkspaceLayout({
        mode: 'single',
        primary: workspaceLayout.primary,
        secondary: null
      });
    }
  };

  // Auto-close left panel on mobile when workspace is active
  useEffect(() => {
    if (isMobile && workspaceLayout.primary) {
      setLeftPanelOpen(false);
    }
  }, [isMobile, workspaceLayout.primary]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Left Navigation Panel */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={leftPanelOpen}
        onClose={() => setLeftPanelOpen(false)}
        sx={{
          width: leftPanelOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
            position: isMobile ? 'fixed' : 'relative'
          }
        }}
      >
        {/* Left Panel Header */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Collaborations
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setLeftPanelOpen(false)}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Navigation Content */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <CollaborationNavigation
            items={collaborationItems}
            selectedItem={workspaceLayout.primary}
            onItemSelect={handleItemSelect}
            onCreateNew={(type) => {
              console.log('Create new:', type);
              // TODO: Implement creation logic
            }}
          />
        </Box>
      </Drawer>

      {/* Main Workspace Area */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // Prevent flex item from overflowing
      }}>
        <WorkspaceManager
          layout={workspaceLayout}
          onLayoutChange={setWorkspaceLayout}
          onItemClose={closeCollaborationItem}
          leftPanelOpen={leftPanelOpen}
          onToggleLeftPanel={() => setLeftPanelOpen(true)}
        >
          {/* Primary workspace content */}
          {workspaceLayout.primary && (
            <CollaborationWorkspace 
              item={workspaceLayout.primary}
              onClose={() => closeCollaborationItem('primary')}
              position="primary"
            />
          )}
        </WorkspaceManager>
      </Box>
    </Box>
  );
};

// Individual Collaboration Workspace Component
interface CollaborationWorkspaceProps {
  item: CollaborationItem;
  onClose: () => void;
}

const CollaborationWorkspace: React.FC<CollaborationWorkspaceProps> = ({ item, onClose }) => {
  const theme = useTheme();

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Collaboration Header */}
      <Box sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
      }}>
        {/* Item Avatar/Icon */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: item.type === 'channel' ? 1 : '50%',
            bgcolor: item.color || theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '14px'
          }}
        >
          {item.avatar || item.name.charAt(0).toUpperCase()}
        </Box>

        {/* Item Info */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {item.name}
          </Typography>
          {item.description && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {item.description}
            </Typography>
          )}
        </Box>

        {/* Close Button */}
        <IconButton 
          size="small" 
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Collaboration Content */}
      <Box sx={{ flex: 1, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
          {item.type === 'agent_command_center' ? 'Agent Command Center' : 
           item.type === 'channel' ? 'Channel Messages' :
           item.type === 'direct_message' ? 'Direct Messages' : 'Connection'} 
          content will be integrated here...
        </Typography>
      </Box>
    </Box>
  );
};

export default CollaborationsPage;

