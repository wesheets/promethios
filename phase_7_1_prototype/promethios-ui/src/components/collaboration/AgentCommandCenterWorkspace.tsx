/**
 * Agent Command Center Workspace Component
 * Direct component rendering for clean, fast agent conversations
 * Includes drop zone header for agent collaboration management
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
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
  onClose
}) => {
  const theme = useTheme();

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

  // TODO: Replace with direct component imports
  // const { currentUser } = useAuth();
  
  // Placeholder for direct component rendering - no more iframe needed

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
          px: 2,
          py: 1, // Reduced padding to match 56px height
          minHeight: '56px', // Match AgentDocker height
          maxHeight: '56px', // Enforce height limit
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
            width: '240px', // Doubled from 120px
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

      {/* Direct Chat Interface - No iframe needed */}
      <Box sx={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.mode === 'dark' ? '#0f172a' : '#ffffff',
        position: 'relative'
      }}>
        {/* Placeholder for direct chat component */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          color: theme.palette.text.secondary
        }}>
          <Typography variant="h6" color="primary">
            {agentName} Command Center
          </Typography>
          <Typography variant="body2">
            Direct component rendering - No iframe complexity
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            TODO: Import and render actual chat components here
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AgentCommandCenterWorkspace;

