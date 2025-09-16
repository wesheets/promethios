/**
 * WorkspaceManager - Advanced workspace layout management
 * Handles single/split view modes with drag & drop support
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  Divider,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  ViewColumn as SplitViewIcon,
  Fullscreen as FullscreenIcon,
  SwapHoriz as SwapIcon,
  MoreVert as MoreIcon,
  OpenInNew as PopOutIcon,
  ContentCopy as DuplicateIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

import { CollaborationItem, WorkspaceLayout } from '../../pages/CollaborationsPage';
import CollaborationMessaging from './CollaborationMessaging';
import AgentCommandCenterWorkspace from './AgentCommandCenterWorkspace';

interface WorkspaceManagerProps {
  layout: WorkspaceLayout;
  onLayoutChange: (layout: WorkspaceLayout) => void;
  onItemClose: (position: 'primary' | 'secondary') => void;
  leftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  children: React.ReactNode;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  layout,
  onLayoutChange,
  onItemClose,
  leftPanelOpen,
  onToggleLeftPanel,
  children
}) => {
  const theme = useTheme();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [resizing, setResizing] = useState(false);
  const [splitRatio, setSplitRatio] = useState(50); // Percentage for primary panel
  const resizeRef = useRef<HTMLDivElement>(null);

  // Handle layout mode toggle
  const toggleLayoutMode = () => {
    if (layout.mode === 'single') {
      // Can't switch to split without a secondary item
      return;
    }
    
    onLayoutChange({
      ...layout,
      mode: layout.mode === 'single' ? 'split' : 'single'
    });
  };

  // Swap primary and secondary positions
  const swapPositions = () => {
    if (layout.mode === 'split' && layout.primary && layout.secondary) {
      onLayoutChange({
        ...layout,
        primary: layout.secondary,
        secondary: layout.primary
      });
    }
  };

  // Handle menu actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Mouse events for resizing
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing || !resizeRef.current) return;

    const container = resizeRef.current.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Constrain between 20% and 80%
    const constrainedRatio = Math.max(20, Math.min(80, newRatio));
    setSplitRatio(constrainedRatio);
  }, [resizing]);

  const handleMouseUp = useCallback(() => {
    setResizing(false);
  }, []);

  // Add/remove mouse event listeners
  React.useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  const getItemDisplayName = (item: CollaborationItem) => {
    const prefix = item.type === 'channel' ? '#' : '';
    return `${prefix}${item.name}`;
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Workspace Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          zIndex: 1
        }}
      >
        {/* Menu button to open left panel */}
        {!leftPanelOpen && (
          <IconButton 
            onClick={onToggleLeftPanel}
            sx={{ color: theme.palette.text.secondary }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Workspace Title */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {layout.primary ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getItemDisplayName(layout.primary)}
              </Typography>
              
              {layout.mode === 'split' && layout.secondary && (
                <>
                  <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                    &
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getItemDisplayName(layout.secondary)}
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <Typography variant="h6" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
              Select a collaboration
            </Typography>
          )}
        </Box>

        {/* Layout Controls */}
        {layout.primary && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Split View Toggle */}
            <Tooltip title={layout.mode === 'single' ? 'Split view' : 'Single view'}>
              <IconButton 
                size="small"
                onClick={toggleLayoutMode}
                disabled={layout.mode === 'single' && !layout.secondary}
                sx={{ color: theme.palette.text.secondary }}
              >
                {layout.mode === 'single' ? <SplitViewIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            {/* Swap Positions (Split View Only) */}
            {layout.mode === 'split' && layout.secondary && (
              <Tooltip title="Swap positions">
                <IconButton 
                  size="small"
                  onClick={swapPositions}
                  sx={{ color: theme.palette.text.secondary }}
                >
                  <SwapIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* More Options */}
            <Tooltip title="More options">
              <IconButton 
                size="small"
                onClick={handleMenuOpen}
                sx={{ color: theme.palette.text.secondary }}
              >
                <MoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Paper>

      {/* Workspace Content */}
      <Box sx={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        {!layout.primary ? (
          // Welcome State
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            p: 4,
            textAlign: 'center'
          }}>
            <Typography variant="h4" sx={{ color: theme.palette.text.secondary, fontWeight: 300 }}>
              Welcome to Collaborations
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, maxWidth: 500 }}>
              Select a channel, direct message, or agent command center from the left panel to start collaborating.
              You can open multiple collaborations side-by-side for maximum productivity.
            </Typography>
          </Box>
        ) : (
          // Active Workspace
          <>
            {/* Primary Collaboration */}
            <Box sx={{ 
              width: layout.mode === 'split' ? `${splitRatio}%` : '100%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              transition: resizing ? 'none' : 'width 0.2s ease'
            }}>
              {children}
            </Box>

            {/* Resize Handle (Split View Only) */}
            {layout.mode === 'split' && layout.secondary && (
              <Box
                ref={resizeRef}
                onMouseDown={handleMouseDown}
                sx={{
                  width: 4,
                  cursor: 'col-resize',
                  bgcolor: theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0',
                  '&:hover': {
                    bgcolor: theme.palette.primary.main
                  },
                  transition: 'background-color 0.2s ease',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: -2,
                    right: -2,
                    bottom: 0,
                    cursor: 'col-resize'
                  }
                }}
              />
            )}

            {/* Secondary Collaboration (Split View) */}
            {layout.mode === 'split' && layout.secondary && (
              <Box sx={{ 
                width: `${100 - splitRatio}%`,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                transition: resizing ? 'none' : 'width 0.2s ease'
              }}>
                <CollaborationWorkspace 
                  item={layout.secondary}
                  onClose={() => onItemClose('secondary')}
                  position="secondary"
                />
              </Box>
            )}
          </>
        )}
      </Box>

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
            <PopOutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pop out to window</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => { handleMenuClose(); /* TODO: Implement */ }}>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate workspace</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={() => { 
            handleMenuClose(); 
            onItemClose('primary'); 
          }}
          sx={{ color: theme.palette.error.main }}
        >
          <ListItemIcon>
            <CloseIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
          </ListItemIcon>
          <ListItemText>Close workspace</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

// Individual Collaboration Workspace Component
interface CollaborationWorkspaceProps {
  item: CollaborationItem;
  onClose: () => void;
  position?: 'primary' | 'secondary';
}

const CollaborationWorkspace: React.FC<CollaborationWorkspaceProps> = ({ 
  item, 
  onClose, 
  position = 'primary' 
}) => {
  // Use specialized workspace for agent command centers
  if (item.type === 'agent_command_center') {
    return (
      <AgentCommandCenterWorkspace
        item={item}
        onClose={onClose}
        position={position}
      />
    );
  }

  // Use generic workspace for other collaboration types
  const theme = useTheme();
  
  // Sample messages - will be replaced with real data
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: `Welcome to ${item.type === 'channel' ? '#' : ''}${item.name}!`,
      senderId: 'system',
      senderName: 'System',
      senderType: 'human' as const,
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      attachments: [],
      mentions: []
    }
  ]);

  // Handle sending messages
  const handleSendMessage = (message: string, selectedAgents?: string[]) => {
    console.log('📤 [CollaborationWorkspace] Sending message:', { message, selectedAgents, item: item.name });
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      senderId: 'current-user',
      senderName: 'You',
      senderType: 'human' as const,
      timestamp: new Date(),
      attachments: [],
      mentions: selectedAgents || []
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate responses from selected agents
    if (selectedAgents && selectedAgents.length > 0) {
      selectedAgents.forEach((agentId, index) => {
        setTimeout(() => {
          const agentResponse = {
            id: (Date.now() + index + 1).toString(),
            content: `Hello! This is a simulated response from Agent ${agentId} regarding: "${message}"`,
            senderId: agentId,
            senderName: `Agent ${agentId}`,
            senderType: 'ai_agent' as const,
            timestamp: new Date(),
            attachments: [],
            mentions: []
          };
          setMessages(prev => [...prev, agentResponse]);
        }, (index + 1) * 1000);
      });
    }
    
    // TODO: Integrate with real messaging service
  };

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
            {item.type === 'channel' ? '#' : ''}{item.name}
          </Typography>
          {item.description && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {item.description}
            </Typography>
          )}
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

        {/* Close Button */}
        <IconButton 
          size="small" 
          onClick={onClose}
          sx={{ color: theme.palette.text.secondary }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Collaboration Messaging */}
      <CollaborationMessaging
        item={item}
        messages={messages}
        onSendMessage={handleSendMessage}
        onTyping={(isTyping) => {
          console.log(`👤 [${item.name}] User is ${isTyping ? 'typing' : 'not typing'}`);
        }}
      />
    </Box>
  );
};

export default WorkspaceManager;

