/**
 * StackingDrawer - Universal drawer component for the stacking drawer system
 * 
 * Features:
 * - Left-to-right opening animation
 * - Dynamic width calculation (100% for single, 50% each for two)
 * - Dynamic positioning based on drawer order
 * - Smooth transitions and animations
 * - Universal component for all drawer types
 */

import React from 'react';
import { Box, IconButton, Typography, Slide } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { usePanelManager } from '../../context/PanelManagerContext';

interface StackingDrawerProps {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerIcon?: React.ReactNode;
}

const StackingDrawer: React.FC<StackingDrawerProps> = ({
  id,
  title,
  open,
  onClose,
  children,
  headerIcon
}) => {
  const { getPanelWidth, getPanelPosition } = usePanelManager();

  const drawerWidth = getPanelWidth(id);
  const drawerPosition = getPanelPosition(id);

  return (
    <Slide direction="right" in={open} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: '56px', // Below AgentDocker
          left: drawerPosition,
          width: drawerWidth,
          height: 'calc(100vh - 56px)',
          bgcolor: '#1e293b',
          borderRight: '1px solid #334155',
          zIndex: 1200,
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease-in-out', // Smooth transitions
        }}
      >
        {/* Fixed Header */}
        <Box
          sx={{
            bgcolor: '#1e293b',
            p: 2,
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: '64px'
          }}
        >
          {/* Left side with icon and title */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {headerIcon}
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#f1f5f9',
                fontWeight: 600,
                fontSize: '16px'
              }}
            >
              {title}
            </Typography>
          </Box>

          {/* Close button */}
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

        {/* Scrollable Content */}
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#1e293b',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#475569',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#64748b',
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Slide>
  );
};

export default StackingDrawer;
