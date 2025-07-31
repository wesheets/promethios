import React from 'react';
import { Box, Typography } from '@mui/material';

const TestGovernancePage: React.FC = () => {
  console.log('🧪 TestGovernancePage rendering');
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#1a202c', minHeight: '100vh', color: 'white' }}>
      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
        TEST GOVERNANCE PAGE
      </Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        This is a minimal test page to isolate navigation issues.
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: '#a0aec0' }}>
        If you can navigate away from this page, the issue is with SimplifiedGovernanceOverviewPage.
      </Typography>
    </Box>
  );
};

export default TestGovernancePage;
