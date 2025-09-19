import React from 'react';
import { Box } from '@mui/material';

/**
 * DashboardPage - Simplified dashboard with centered spark text logo
 * 
 * Features:
 * - Full screen centered layout
 * - Default site background color
 * - Spark text logo centered
 * - Clean, minimal design
 */
const DashboardPage: React.FC = () => {
  return (
    <Box
      sx={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Centered Spark Text Logo */}
      <Box
        component="img"
        src="/flamelogonewbackground.png"
        alt="Flame Logo"
        sx={{
          width: '200px',
          height: 'auto',
          objectFit: 'contain',
          opacity: 0.8,
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
        }}
      />
    </Box>
  );
};

export default DashboardPage;
