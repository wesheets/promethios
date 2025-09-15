import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Psychology } from '@mui/icons-material';

interface AIToAIInteractionIndicatorProps {
  [key: string]: any;
}

const AIToAIInteractionIndicator: React.FC<AIToAIInteractionIndicatorProps> = () => {
  return (
    <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #3b82f6' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology sx={{ color: '#3b82f6', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'white' }}>
          AI-to-AI Interaction Indicator (Demo)
        </Typography>
      </Box>
      <Chip
        label="AI Collaboration Active"
        size="small"
        sx={{ mt: 1, bgcolor: '#3b82f6', color: 'white' }}
      />
    </Box>
  );
};

export default AIToAIInteractionIndicator;

