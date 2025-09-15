import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Security } from '@mui/icons-material';

interface GovernanceReceiptOverlayProps {
  [key: string]: any;
}

const GovernanceReceiptOverlay: React.FC<GovernanceReceiptOverlayProps> = () => {
  return (
    <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 1, border: '1px solid #059669' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security sx={{ color: '#059669', fontSize: 20 }} />
        <Typography variant="body2" sx={{ color: 'white' }}>
          Governance Receipt Overlay (Demo)
        </Typography>
      </Box>
      <Chip
        label="Compliance Tracking Active"
        size="small"
        sx={{ mt: 1, bgcolor: '#059669', color: 'white' }}
      />
    </Box>
  );
};

export default GovernanceReceiptOverlay;

