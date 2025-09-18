/**
 * AgentCommandCenterWorkspace - Embeds the actual command center interface
 * Uses iframe with CSS to hide navigation elements (clean content only)
 * Adapts between 100% and 50% width for side-by-side collaboration
 */

import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct the actual command center URL
  const commandCenterUrl = `/ui/chat/chatbots?agent=${agentId}`;

  // Inject CSS to hide navigation elements when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;

        // Inject CSS to hide navigation elements
        const style = iframeDoc.createElement('style');
        style.textContent = `
          /* Hide left navigation */
          nav[aria-label="Main navigation"],
          .left-navigation,
          .sidebar,
          .navigation-panel,
          [data-testid="left-nav"],
          .MuiDrawer-root,
          .navigation-drawer {
            display: none !important;
          }
          
          /* Hide top docker/header */
          .top-docker,
          .header-docker,
          .app-header,
          .top-navigation,
          [data-testid="top-header"],
          .MuiAppBar-root {
            display: none !important;
          }
          
          /* Adjust main content to fill space */
          main,
          .main-content,
          .chat-container,
          .content-area {
            margin-left: 0 !important;
            padding-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Hide any floating navigation elements */
          .floating-nav,
          .nav-overlay,
          .navigation-overlay {
            display: none !important;
          }
          
          /* Ensure full height usage */
          body, html, #root {
            margin: 0 !important;
            padding: 0 !important;
          }
        `;
        iframeDoc.head.appendChild(style);
      } catch (error) {
        // Cross-origin restrictions - can't inject CSS
        console.log('Cannot inject CSS due to cross-origin restrictions');
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc'
    }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}
          >
            {agentName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
            </Box>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              AI Agent Command Center
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
          
          <IconButton
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
          
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Embedded Command Center with Hidden Navigation */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <iframe
          ref={iframeRef}
          src={commandCenterUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff'
          }}
          title={`${agentName} Command Center`}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </Box>
    </Box>
  );
};

export default AgentCommandCenterWorkspace;

