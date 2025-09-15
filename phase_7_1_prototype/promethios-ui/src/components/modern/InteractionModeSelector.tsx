import React from 'react';
import { Box, Typography } from '@mui/material';

export type InteractionMode = 'collaborative' | 'competitive' | 'educational' | 'creative';

interface InteractionModeSelectorProps {
  [key: string]: any;
}

const InteractionModeSelector: React.FC<InteractionModeSelectorProps> = () => {
  return (
    <Box sx={{ p: 2, bgcolor: '#1e293b', borderRadius: 1 }}>
      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
        🎯 Interaction Mode Selector (Demo Placeholder)
      </Typography>
    </Box>
  );
};

export default InteractionModeSelector;

