/**
 * MINIMAL Governance Overview Page - For Navigation Testing
 * 
 * Stripped down version to test if navigation works
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

const SimplifiedGovernanceOverviewPage: React.FC = () => {
  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" sx={{ mb: 3, color: 'white' }}>
        Governance Overview - MINIMAL TEST
      </Typography>
      
      <Typography variant="body1" sx={{ color: '#a0aec0' }}>
        This is a minimal version to test navigation. If navigation works with this component,
        we know the issue is in one of the removed components.
      </Typography>
    </Box>
  );
};

export default SimplifiedGovernanceOverviewPage;

