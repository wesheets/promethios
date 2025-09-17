import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon
} from '@mui/icons-material';
import { usePanelManager } from '../../context/PanelManagerContext';
import QuickStartSetup from '../chat/setup/QuickStartSetup';

interface AgentCreationPanelProps {
  open: boolean;
  onClose: () => void;
  onAgentCreated?: (agentData: any) => void;
}

const AgentCreationPanel: React.FC<AgentCreationPanelProps> = ({
  open,
  onClose,
  onAgentCreated
}) => {
  const { getPanelWidth } = usePanelManager();

  if (!open) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: getPanelWidth('agent-creation'),
        bgcolor: '#0f172a',
        borderLeft: '1px solid #334155',
        zIndex: 1300,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #334155',
          bgcolor: '#1e293b'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: '#f8fafc',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          🤖 Create New Agent
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: '#94a3b8',
            '&:hover': { color: '#f8fafc', bgcolor: '#334155' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Embedded Quick Start Setup */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: '#0f172a'
        }}
      >
        <QuickStartSetup 
          onAgentCreated={(agentData) => {
            console.log('🤖 [AgentCreationPanel] Agent created:', agentData);
            if (onAgentCreated) {
              onAgentCreated(agentData);
            }
          }}
          embeddedMode={true}
        />
      </Box>
    </Paper>
  );
};

export default AgentCreationPanel;

