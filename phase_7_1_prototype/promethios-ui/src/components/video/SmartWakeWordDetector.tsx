import React from 'react';
import { Box, Chip } from '@mui/material';
import { Psychology } from '@mui/icons-material';

interface SmartWakeWordDetectorProps {
  isActive: boolean;
  onAIActivated: (aiId: string) => void;
  participants: any[];
}

const SmartWakeWordDetector: React.FC<SmartWakeWordDetectorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 80,
        right: 24,
        zIndex: 1000
      }}
    >
      <Chip
        icon={<Psychology />}
        label="Smart Wake Word Detection (Demo)"
        size="small"
        sx={{
          bgcolor: '#1e293b',
          color: '#94a3b8'
        }}
      />
    </Box>
  );
};

export default SmartWakeWordDetector;

