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
import { useDropTarget } from '../../hooks/useDragDrop';

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

  // Set up drop target for agent collaboration
  const { dropRef, isOver, canDrop, dropHandlers } = useDropTarget(
    `command-center-${agentId}`,
    'command_center',
    ['agent', 'human'],
    async (source, context) => {
      console.log('🤝 Agent dropped on command center:', {
        source: source.data,
        target: agentId,
        position: context.position
      });
      
      // Handle agent collaboration - could open a new panel or start collaboration
      // This is where you'd implement the actual collaboration logic
      if (source.type === 'agent') {
        console.log(`🤖 Starting collaboration between ${source.data.name} and ${agentName}`);
        // Could trigger opening a second command center or collaboration interface
      } else if (source.type === 'human') {
        console.log(`👤 Human ${source.data.name} joining ${agentName}'s command center`);
        // Could trigger human-agent collaboration interface
      }
    },
    { agentId, agentName }
  );

  // Construct the actual command center URL with navigation hiding parameters
  const commandCenterUrl = `/ui/chat/chatbots?agent=${agentId}&hideNav=true&hideDocker=true&embedded=true`;

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
          
          /* Hide top docker/header with agent avatars */
          .top-docker,
          .header-docker,
          .app-header,
          .top-navigation,
          [data-testid="top-header"],
          .MuiAppBar-root,
          .agent-docker,
          .agent-header,
          .agent-selector,
          .top-agent-bar,
          .agent-navigation,
          .chatbot-header,
          .agent-tabs,
          .agent-switcher {
            display: none !important;
          }
          
          /* Hide any header with agent avatars/circles */
          header,
          .header,
          [role="banner"],
          .top-bar,
          .navigation-header {
            display: none !important;
          }
          
          /* Hide specific agent avatar containers and docker agents */
          .agent-avatar-container,
          .agent-circle-container,
          .chatbot-avatar-bar,
          .agent-selection-bar,
          .docker-agents,
          .agent-docker-container,
          .agent-avatars,
          .agent-selector-bar,
          .collaboration-agents,
          .agent-collaboration-bar {
            display: none !important;
          }
          
          /* Hide docker agent circles specifically */
          .MuiAvatar-root[style*="position"],
          .agent-avatar-circle,
          .docker-agent-avatar,
          .collaboration-avatar,
          .agent-circle,
          .chatbot-circle {
            display: none !important;
          }
          
          /* Hide any floating agent elements */
          [class*="agent"][style*="position: fixed"],
          [class*="agent"][style*="position: absolute"],
          [class*="docker"][style*="position: fixed"],
          [class*="docker"][style*="position: absolute"] {
            display: none !important;
          }
          
          /* Adjust main content to fill space */
          main,
          .main-content,
          .chat-container,
          .content-area,
          .chat-interface,
          .workspace-content {
            margin-left: 0 !important;
            margin-top: 0 !important;
            padding-left: 0 !important;
            padding-top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            max-height: 100vh !important;
          }
          
          /* Hide any floating navigation elements */
          .floating-nav,
          .nav-overlay,
          .navigation-overlay {
            display: none !important;
          }
          
          /* Ensure full height usage and remove any top spacing */
          body, html, #root {
            margin: 0 !important;
            padding: 0 !important;
            overflow-x: hidden !important;
          }
          
          /* Hide any top-positioned fixed elements */
          [style*="position: fixed"][style*="top:"],
          [style*="position: absolute"][style*="top: 0"] {
            display: none !important;
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
          bgcolor: theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          position: 'relative'
        }}
      >
        {/* Docker Drop Zone - positioned at ~35% from left to align with AgentDocker */}
        <Box
          ref={dropRef}
          {...dropHandlers}
          sx={{
            position: 'absolute',
            left: '35%',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '120px',
            height: '32px',
            border: `2px dashed ${
              isOver && canDrop 
                ? '#3b82f6' 
                : canDrop 
                  ? 'rgba(59, 130, 246, 0.6)' 
                  : 'rgba(148, 163, 184, 0.4)'
            }`,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: isOver && canDrop 
              ? 'rgba(59, 130, 246, 0.15)' 
              : canDrop 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'rgba(148, 163, 184, 0.05)',
            transition: 'all 0.2s ease-in-out',
            cursor: canDrop ? 'copy' : 'default',
            '&:hover': {
              borderColor: 'rgba(59, 130, 246, 0.6)',
              bgcolor: 'rgba(59, 130, 246, 0.1)',
            }
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              color: isOver && canDrop 
                ? '#3b82f6' 
                : theme.palette.text.secondary,
              fontSize: '10px',
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            {isOver && canDrop ? 'Drop to Collaborate' : 'Drop Agent Here'}
          </Typography>
        </Box>
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

