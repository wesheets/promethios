import React from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { Psychology } from '@mui/icons-material';

interface ContextAwarenessManagerProps {
  participants: any[];
  isRecording: boolean;
  activeAI?: string | null;
}

const ContextAwarenessManager: React.FC<ContextAwarenessManagerProps> = ({ isRecording }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 120,
        right: 24,
        width: 250,
        zIndex: 1000
      }}
    >
      <Paper
        sx={{
          p: 2,
          bgcolor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Psychology sx={{ color: '#3b82f6', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 600 }}>
            Context Awareness (Demo)
          </Typography>
        </Box>
        
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          AI-powered context understanding and conversation intelligence
        </Typography>

        {isRecording && (
          <Chip
            label="Recording Active"
            size="small"
            sx={{
              mt: 1,
              bgcolor: '#ef4444',
              color: 'white'
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ContextAwarenessManager;

